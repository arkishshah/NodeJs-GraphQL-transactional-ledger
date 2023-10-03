const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type Transaction {
        ID: Int!
        Amount: Float!
        CounterpartyName: String!
        Date: String!
        MethodCode: Int!
        MethodName: String
        Note: String!
        Status: String!
    }
    
    type Query {
        getTransaction(ID: Int!): Transaction
        listTransactions: [Transaction]
        listTransactionsByMethod(MethodName: String!): [Transaction]
    }

    type Mutation {
        createTransaction(Amount: Float!, CounterpartyName: String!, Date: String!, MethodCode: Int, Note: String!, Status: String!): Transaction
        deleteTransaction(ID: Int!): Transaction
        updateTransaction(ID: Int!, Note: String, Status: String): Transaction
    }
`);

module.exports = schema;