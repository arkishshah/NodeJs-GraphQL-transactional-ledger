const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { root } = require('./src/resolvers');
const schema = require('./src/schema');
const app = express();

app.use('/transactions', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true, // You can turn this off in production
}));

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
