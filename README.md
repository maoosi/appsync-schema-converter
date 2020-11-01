# AppSync Schema Converter
The sole purpose of this package is to convert modern GraphQL schemas into AppSync compatible version.

1. `printSchema()` is a copy of `graphql@^14.4.2/utilities/schemaPrinter.js@printSchema` with `includesDirectives: Boolean` option added.
2. `convertSchemas(schemas: [string])` takes an array of GraphQL SDL string and converts them into one single AppSync comptaible schema.

My team only works with Apollo, so expects more care on that front.

*If AppSync updates their ancient GraphQL engine, I am more than happy to ditch this package.*

# Serverless Framework
This package also made with [`serverless-appsync-plugin`](https://www.npmjs.com/package/serverless-appsync-plugin) in mind, especially useful when [`merge-graphql-schemas`](https://www.npmjs.com/package/merge-graphql-schemas) was in your stack.

You make use of [variables in JavaScript](https://serverless.com/framework/docs/providers/aws/guide/variables/#reference-variables-in-javascript-files) and write a little script to merge schemas into AppSync compatible one.

Based on your `serverless-appsync-plugin` settings, change this line in your `serverless.yml`.
```YAML
custom:
  appSync:
    schema: ${file(schema.js):compile}
```

Then read and convert your schemas in `schema.js@compile`.
```javascript
const glob = require("fast-glob");
const { promises: fs } = require('fs');
const { convertSchemas } = require("appsync-schema-converter");

const SCHEMA_PATH = './schema.graphql';

module.exports.compile = async _ => {
  let schemas;

  schemas = await glob(`${__dirname}/schemas/**/*.graphql`);
  schemas = await Promise.all(schemas.map(async schema => (await fs.readFile(schema, { encoding: "utf-8" }))));

  schemas = convertSchemas(schemas, {
    commentDescriptions: true,
    includeDirectives: true,
  });

  await fs.writeFile(SCHEMA_PATH, schemas);

  return SCHEMA_PATH;
};
```

# Contributors
- Vicary Archangel (@vicary)
- Andy Fu (@andyfu84)
