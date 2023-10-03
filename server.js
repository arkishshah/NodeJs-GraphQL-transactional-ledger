const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { root } = require('./src/resolvers');
const schema = require('./src/schema');
const app = express();

app.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true, // You can turn this off in production
}));

const PORT = process.env.PORT || 4000; // Use the PORT Heroku sets or 4000 as a fallback.
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
