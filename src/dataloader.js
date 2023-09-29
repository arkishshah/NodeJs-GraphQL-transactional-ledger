const AWS = require('aws-sdk');
const faker = require('faker');
require('dotenv').config();

class DynamoDBDataLoader {
  constructor() {
    AWS.config.update({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    this.dynamoDb = new AWS.DynamoDB.DocumentClient();
    this.methods = {
      'Card Purchase': 12,
      'ACH': 34,
      'Wire': 56,
      'Fee': 78
    };
  }

  generateTransactions(num) {
    const transactions = [];
    for (let i = 0; i < num; i++) {
        const methodNames = Object.keys(this.methods);
        const randomMethod = methodNames[Math.floor(Math.random() * methodNames.length)];
        const amount = faker.finance.amount(-1000, 1000, 2);
        
        transactions.push({
            ID: i + 1,  // Numeric ID
            Date: faker.date.recent().toISOString(),
            Amount: parseFloat(amount),
            Status: amount >= 0 ? 'Posted' : 'Pending',
            CounterpartyName: faker.company.companyName(),
            MethodCode: this.methods[randomMethod],
            Note: faker.lorem.sentence()
        });
    }
    return transactions;
}

  async insertTransaction(transaction) {
    const params = {
      TableName: 'Transactions',
      Item: transaction
    };

    try {
      await this.dynamoDb.put(params).promise();
      console.log(`Inserted transaction with ID: ${transaction.ID}`);
    } catch (error) {
      console.error(`Failed to insert transaction with ID: ${transaction.ID}. Error:`, error);
    }
  }

  async loadTransactionsToDynamoDB(transactions) {
    for (const transaction of transactions) {
      await this.insertTransaction(transaction);
    }
  }

  async execute() {
    const transactions = this.generateTransactions(100);
    await this.loadTransactionsToDynamoDB(transactions);
  }
}

const loader = new DynamoDBDataLoader();
loader.execute();
