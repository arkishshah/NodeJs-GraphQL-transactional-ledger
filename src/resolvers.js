
const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();
const TableName = "Transactions";

// Method name mapping. 

const methodCodeToNameMapping = {
    12: "Card Purchase",
    34: "ACH",
    56: "Wire",
    78: "Fee"
};

// Generate an ID to store the transactional records

const generateID = () => {
    return parseInt((Date.now() % 1000000000).toString());
};

// Fetch method code from amount, if not specified already and assign an arbitrary value.

const getMethodCodeFromAmount = (amount) => {
    return amount > 0 ? 90 : 91;
};

// Determine method name from method code.

const getMethodNameFromCode = (methodCode) => {
    if (!methodCode && methodCode !== 0) {
        return "Unknown";
    }
    return methodCodeToNameMapping[methodCode] || (methodCode === 90 ? "Incoming" : "Outgoing");
};

const root = {

    // Fetch and list trasactions by passing an ID

    getTransaction: ({ ID }) => {
        const params = {
            TableName,
            Key: {
                "ID": ID
            }
        };
        return docClient.get(params).promise().then(data => {
            if(data.Item) {
                data.Item.MethodName = getMethodNameFromCode(data.Item.MethodCode);
            }
            return data.Item;
        });
    },


    // Fetch and list all transactions

    listTransactions: () => {
        const params = {
            TableName
        };
        return docClient.scan(params).promise().then(data => {
            if(data.Items) {
                data.Items.forEach(item => {
                    item.MethodName = getMethodNameFromCode(item.MethodCode);
                });
            }
            return data.Items;
        });
    },

    // Create and save a transaction

    createTransaction: async (transaction) => {
        if (!transaction.Amount || !transaction.CounterpartyName || !transaction.Date || !transaction.Note || !transaction.Status) {
            throw new Error("All fields are required to create a transaction.");
        }

        if (!transaction.MethodCode && !transaction.MethodName) {
            transaction.MethodCode = getMethodCodeFromAmount(transaction.Amount);
            transaction.MethodName = getMethodNameFromCode(transaction.MethodCode);
        } else if (!transaction.MethodName) {
            transaction.MethodName = getMethodNameFromCode(transaction.MethodCode);
        } else {
            const methodCode = Object.keys(methodCodeToNameMapping).find(code => methodCodeToNameMapping[code] === transaction.MethodName);
            transaction.MethodCode = parseInt(methodCode);
        }

        const params = {
            TableName,
            Item: {
                ID: generateID(),
                ...transaction
            }
        };

        try {
            await docClient.put(params).promise();
            return params.Item;
        } catch (error) {
            throw new Error("Error creating transaction: " + error.message);
        }
    },

    // Update a transaction. (Only Note and Status allowed to be updated)

    updateTransaction: async (args) => {
        const { ID, Note, Status } = args;
    
        // Check if any other fields are provided in the update
        const allowedFields = ["Note", "Status"];
        const providedFields = Object.keys(args);
        for (let field of providedFields) {
            if (!allowedFields.includes(field) && field !== "ID") {
                throw new Error(`Updates to the ${field} field are not allowed.`);
            }
        }
    
        const updates = { Note, Status };
    
        // Fetch existing transaction
        const getParams = {
            TableName,
            Key: {
                "ID": ID
            }
        };
        const existingTransaction = await docClient.get(getParams).promise();
    
        if (!existingTransaction.Item) {
            throw new Error("Transaction not found.");
        }
    
        // Merge updates
        const updatedTransaction = {
            ...existingTransaction.Item,
            ...updates
        };
    
        // Store updated transaction
        const putParams = {
            TableName,
            Item: updatedTransaction
        };
        await docClient.put(putParams).promise();
    
        return updatedTransaction;
    },    

    // Delete a transaction

    deleteTransaction: async ({ ID }) => {
        if (!ID) {
            throw new Error("ID is required to delete a transaction.");
        }

        const params = {
            TableName,
            Key: { ID }
        };

        try {
            await docClient.delete(params).promise();
            return { ID };
        } catch (error) {
            throw new Error("Error deleting transaction: " + error.message);
        }
    },

    // Returns list of transactions by Method Name

    listTransactionsByMethod: async ({ MethodName }) => {
        const methodCode = Object.keys(methodCodeToNameMapping).find(code => methodCodeToNameMapping[code] === MethodName);
        if (!methodCode) {
            throw new Error("Invalid Method Name.");
        }

        const params = {
            TableName,
            FilterExpression: "MethodCode = :methodCode",
            ExpressionAttributeValues: { ":methodCode": parseInt(methodCode) }
        };

        try {
            const response = await docClient.scan(params).promise();
            if(response.Items) {
                response.Items.forEach(item => {
                    item.MethodName = getMethodNameFromCode(item.MethodCode);
                });
            }
            return response.Items;
        } catch (error) {
            throw new Error("Error fetching transactions by method: " + error.message);
        }
    },

    // Calculates the sum of all transactions. 

    getAccountBalance: async () => {
        const params = {
            TableName
        };

        try {
            const response = await docClient.scan(params).promise();
            return response.Items.reduce((acc, transaction) => acc + transaction.Amount, 0);
        } catch (error) {
            throw new Error("Error fetching account balance: " + error.message);
        }
    },

    //Returns the method, by passing method code.

    getMethodMapping: ({ MethodCode }) => {
        return methodCodeToNameMapping[MethodCode] || "Unknown";
    }   
};

module.exports = {root, generateID, getMethodCodeFromAmount, getMethodNameFromCode};
