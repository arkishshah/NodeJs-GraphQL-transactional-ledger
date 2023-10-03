const { root } = require('../src/resolvers');

const AWS = require('aws-sdk');

// Mocking the AWS SDK functions
const mockGetPromise = jest.fn();
const mockPutPromise = jest.fn();
const mockScanPromise = jest.fn();
const mockUpdatePromise = jest.fn();
const mockDeletePromise = jest.fn();

AWS.DynamoDB.DocumentClient.prototype.get = jest.fn().mockReturnValue({ promise: mockGetPromise });
AWS.DynamoDB.DocumentClient.prototype.put = jest.fn().mockReturnValue({ promise: mockPutPromise });
AWS.DynamoDB.DocumentClient.prototype.scan = jest.fn().mockReturnValue({ promise: mockScanPromise });
AWS.DynamoDB.DocumentClient.prototype.update = jest.fn().mockReturnValue({ promise: mockUpdatePromise });
AWS.DynamoDB.DocumentClient.prototype.delete = jest.fn().mockReturnValue({ promise: mockDeletePromise });

describe('resolvers', () => {

    test('getTransaction should retrieve a transaction by ID', async () => {
        const mockData = { Item: { ID: 1, Amount: 100 } };
        mockGetPromise.mockResolvedValueOnce(mockData);

        const result = await root.getTransaction({ ID: 1 });
        expect(result).toEqual(mockData.Item);
    });

    test('listTransactions should retrieve all transactions', async () => {
        const mockData = { Items: [{ ID: 1 }, { ID: 2 }] };
        mockScanPromise.mockResolvedValueOnce(mockData);

        const result = await root.listTransactions();
        expect(result).toEqual(mockData.Items);
    });

    test('createTransaction should create a new transaction', async () => {
        const mockTransaction = {
            Amount: 100,
            CounterpartyName: "Hooper",
            Date: "2023-09-01T12:00:00.000Z",
            Note: "Test",
            Status: "Completed"
        };
        mockPutPromise.mockResolvedValueOnce({});

        const result = await root.createTransaction(mockTransaction);
        expect(result.Amount).toEqual(mockTransaction.Amount);
        expect(result.CounterpartyName).toEqual(mockTransaction.CounterpartyName);
    });
    
    test('deleteTransaction should delete a transaction', async () => {
        mockDeletePromise.mockResolvedValueOnce({});

        const result = await root.deleteTransaction({ ID: 1 });
        expect(result).toEqual({ ID: 1 });
    });

    test('listTransactionsByMethod should retrieve transactions by method name', async () => {
        const mockData = { Items: [{ ID: 1, MethodCode: 12 }, { ID: 2, MethodCode: 12 }] };
        mockScanPromise.mockResolvedValueOnce(mockData);

        const result = await root.listTransactionsByMethod({ MethodName: "Card Purchase" });
        expect(result).toEqual(mockData.Items);
    });

    test('getAccountBalance should return the sum of all transaction amounts', async () => {
        const mockData = { Items: [{ Amount: 100 }, { Amount: 50 }] };
        mockScanPromise.mockResolvedValueOnce(mockData);

        const result = await root.getAccountBalance();
        expect(result).toEqual(150);
    });

    test('getMethodMapping should return the mapping of Method Code to Method Name', () => {
        const result = root.getMethodMapping();
        expect(result).toEqual([
            { code: 12, name: "Card Purchase" },
            { code: 34, name: "ACH" },
            { code: 56, name: "Wire" },
            { code: 78, name: "Fee" }
        ]);
    });

});

