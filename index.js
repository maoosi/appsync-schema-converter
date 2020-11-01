const {
    parse,
    extendSchema,
    buildASTSchema
} = require("graphql14");

const {
    printSchema,
    printIntrospectionSchema,
    printType
} = require("./lib/schemaPrinter");

const AppSyncScalars = [
    "scalar AWSDate",
    "scalar AWSTime",
    "scalar AWSDateTime",
    "scalar AWSTimestamp",
    "scalar AWSEmail",
    "scalar AWSJSON",
    "scalar AWSURL",
    "scalar AWSPhone",
    "scalar AWSIPAddress",
];

const AppSyncDirectives = [
    `directive @aws_subscribe(mutations: [String!]!) on FIELD_DEFINITION`,
    `directive @aws_api_key on OBJECT | FIELD_DEFINITION | INPUT_FIELD_DEFINITION`,
    `directive @aws_iam on OBJECT | FIELD_DEFINITION | INPUT_FIELD_DEFINITION`,
    `directive @aws_oidc on OBJECT | FIELD_DEFINITION | INPUT_FIELD_DEFINITION`,
    `directive @aws_cognito_user_pools(cognito_groups: [String!]!) on OBJECT | FIELD_DEFINITION | INPUT_FIELD_DEFINITION`,
    `directive @aws_auth(cognito_groups: [String!]!) on OBJECT | FIELD_DEFINITION | INPUT_FIELD_DEFINITION`,
];

/**
 * Convert Apollo GraphQL schemas into AppSync verison.
 *
 * @param {[string]} An array of GraphQL SDL string to be converted.
 * @param {object} options
 *   - {boolean} options.commentDescriptions Use legacy comment as type description.
 *   - {boolean} options.includeDirectives Include field directive declarations as output.
 */
function convertSchemas(schemas, {
    commentDescriptions = false,
    includeDirectives = false
} = {}) {
    const AppSyncDefs = AppSyncScalars.concat(AppSyncDirectives);
    let schema = Array.isArray(schemas) ? schemas : [schemas];

    schema = AppSyncDefs.concat(schemas).join("\n");
    schema = parse(schema);

    // buildSchema() does not handles type extension, extendSchema() is required.
    schema = (schema.definitions || []).reduce(
        (prev, astNode) => {
            const {
                defs,
                exts
            } = prev;

            if (/Extension$/.test(astNode.kind)) {
                exts.push(astNode);
            } else {
                defs.push(astNode);
            }

            return prev;
        }, {
            defs: [],
            exts: []
        },
    );

    schema = extendSchema(buildASTSchema({
        kind: "Document",
        definitions: schema.defs
    }), {
        kind: "Document",
        definitions: schema.exts,
    });

    schema = printSchema(schema, {
        commentDescriptions,
        includeDirectives
    });

    AppSyncDefs.forEach(type => {
        schema = schema.replace(type, "");
    });

    return schema.replace(/\n{3,}/, "\n\n").trim();
}

module.exports.printSchema = printSchema;
module.exports.printIntrospectionSchema = printIntrospectionSchema;
module.exports.printType = printType;
module.exports.AppSyncScalars = AppSyncScalars;
module.exports.AppSyncDirectives = AppSyncDirectives;
module.exports.convertSchemas = convertSchemas;
