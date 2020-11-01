# AppSync Schema Converter

> **This project is a Fork from [gitlab.com/vicary/appsync-schema-converter](https://gitlab.com/vicary/appsync-schema-converter) and include the following list of modifications:**
>
> - Added support for `cognito_groups` inside both `@aws_auth` and `@aws_cognito_user_pools` directives.
> - Added support for `INPUT_FIELD_DEFINITION` directives.
> - Various upgrades (docs, dependencies, formatting, ...).

The sole purpose of this package is to convert modern GraphQL schemas into AppSync compatible version.

1. `printSchema()` is a copy of `graphql@^14.4.2/utilities/schemaPrinter.js@printSchema` with `includesDirectives: Boolean` option added.
2. `convertSchemas(schemas: [string])` takes an array of GraphQL SDL string and converts them into one single AppSync comptaible schema.

## Installation

```shell
# with yarn
yarn add @maoosi/appsync-schema-converter

# with npm
npm i @maoosi/appsync-schema-converter
```

## Usage

```javascript
// import @maoosi/appsync-schema-converter
const { convertSchemas } = require('@maoosi/appsync-schema-converter')

// merge multiple AppSync compatible schemas
const mergedSchema = convertSchemas([schema1, schema2], {
    commentDescriptions: true,
    includeDirectives: true,
})
```

## Contributors

- Vicary Archangel (@vicary)
- Andy Fu (@andyfu84)
- Sylvain Simao (@maoosi)
