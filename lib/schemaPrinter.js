// schemaPrinter.js: A modification of graphql@14.4.2/utilities/schemaPrinter.js to include directives.
"use strict";

const {
    isSpecifiedDirective,
    isSpecifiedScalarType,
    isIntrospectionType,
    isScalarType,
    isObjectType,
    isInterfaceType,
    isUnionType,
    isEnumType,
    isInputObjectType,
    DEFAULT_DEPRECATION_REASON,
    GraphQLString,
    print,
    astFromValue,
    printIntrospectionSchema,
} = require("graphql14");

const _flatMap = require("graphql14/polyfills/flatMap")
const _objectValues = require("graphql14/polyfills/objectValues")
const _inspect = require("graphql14/jsutils/inspect");
const {
    printBlockString
} = require("graphql14/language/blockString");

module.exports.printSchema = printSchema;
module.exports.printIntrospectionSchema = printIntrospectionSchema;
module.exports.printType = printType;

/**
 * Accepts options as a second argument:
 *
 *    - commentDescriptions:
 *        Provide true to use preceding comments as the description.
 *    - includeDirectives:
 *        Include directive definitions.
 */
function printSchema(schema, options) {
    return printFilteredSchema(schema, n => !isSpecifiedDirective(n), isDefinedType, options);
}

function isDefinedType(type) {
    return !(0, isSpecifiedScalarType)(type) && !(0, isIntrospectionType)(type);
}

function printFilteredSchema(schema, directiveFilter, typeFilter, options) {
    var directives = schema.getDirectives().filter(directiveFilter);
    var typeMap = schema.getTypeMap();
    var types = (0, _objectValues.default)(typeMap).sort(function (type1, type2) {
        return type1.name.localeCompare(type2.name);
    }).filter(typeFilter);
    return [printSchemaDefinition(schema)].concat(directives.map(function (directive) {
        return printDirective(directive, options);
    }), types.map(function (type) {
        return printType(type, options);
    })).filter(Boolean).join('\n\n') + '\n';
}

function printSchemaDefinition(schema) {
    if (isSchemaOfCommonNames(schema)) {
        return;
    }

    var operationTypes = [];
    var queryType = schema.getQueryType();

    if (queryType) {
        operationTypes.push("  query: ".concat(queryType.name));
    }

    var mutationType = schema.getMutationType();

    if (mutationType) {
        operationTypes.push("  mutation: ".concat(mutationType.name));
    }

    var subscriptionType = schema.getSubscriptionType();

    if (subscriptionType) {
        operationTypes.push("  subscription: ".concat(subscriptionType.name));
    }

    return "schema {\n".concat(operationTypes.join('\n'), "\n}");
}
/**
 * GraphQL schema define root types for each type of operation. These types are
 * the same as any other type and can be named in any manner, however there is
 * a common naming convention:
 *
 *   schema {
 *     query: Query
 *     mutation: Mutation
 *   }
 *
 * When using this naming convention, the schema description can be omitted.
 */


function isSchemaOfCommonNames(schema) {
    var queryType = schema.getQueryType();

    if (queryType && queryType.name !== 'Query') {
        return false;
    }

    var mutationType = schema.getMutationType();

    if (mutationType && mutationType.name !== 'Mutation') {
        return false;
    }

    var subscriptionType = schema.getSubscriptionType();

    if (subscriptionType && subscriptionType.name !== 'Subscription') {
        return false;
    }

    return true;
}

function printType(type, options) {
    if ((0, isScalarType)(type)) {
        return printScalar(type, options);
    } else if ((0, isObjectType)(type)) {
        return printObject(type, options);
    } else if ((0, isInterfaceType)(type)) {
        return printInterface(type, options);
    } else if ((0, isUnionType)(type)) {
        return printUnion(type, options);
    } else if ((0, isEnumType)(type)) {
        return printEnum(type, options);
    } else if ((0, isInputObjectType)(type)) {
        return printInputObject(type, options);
    } // Not reachable. All possible types have been considered.

    /* istanbul ignore next */


    throw new Error("Unexpected type: \"".concat((0, _inspect)(type), "\"."));
}

function printScalar(type, options) {
    return printDescription(options, type) + "scalar ".concat(type.name);
}

function printObject(type, options) {
    var interfaces = type.getInterfaces();
    var implementedInterfaces = interfaces.length ? ' implements ' + interfaces.map(function (i) {
        return i.name;
    }).join(' & ') : '';

    return printDescription(options, type) + "type ".concat(type.name).concat(implementedInterfaces) + printObjectDirectives(type, options) + printFields(options, type);
}

function printObjectDirectives(type, options) {
    if (options && options.includeDirectives) {
        return ' ' + type.astNode.directives.map(print).join(" ");
    }

    return '';
}

function printInterface(type, options) {
    return printDescription(options, type) + "interface ".concat(type.name) + printFields(options, type);
}

function printUnion(type, options) {
    var types = type.getTypes();
    var possibleTypes = types.length ? ' = ' + types.join(' | ') : '';
    return printDescription(options, type) + 'union ' + type.name + possibleTypes;
}

function printEnum(type, options) {
    var values = type.getValues().map(function (value, i) {
        return '  ' + value.name + printDeprecated(value);
    });
    return printDescription(options, type) + "enum ".concat(type.name) + printBlock(values);
}

function printInputObject(type, options) {
    var fields = (0, _objectValues.default)(type.getFields()).map(function (f, i) {
        return printDescription(options, f, '  ', !i) + '  ' + printInputValue(f);
    });
    return printDescription(options, type) + "input ".concat(type.name) + printBlock(fields);
}

function printFields(options, type) {
    var fields = (0, _objectValues.default)(type.getFields()).map(function (f, i) {
        if (options && options.includeDirectives) {
            if (f && f.astNode && f.astNode.directives && f.astNode.directives.length) {
                f.astNode.description = null;

                var fieldDecl = print(f.astNode);

                return printDescription(options, f, '  ', !i) + '  ' + fieldDecl.replace(/\n/g, '\n  ');
            }
        }

        return printDescription(options, f, '  ', !i) + '  ' + f.name + printArgs(options, f.args, '  ') + ': ' + String(f.type) + printDeprecated(f);
    });
    return printBlock(fields);
}

function printBlock(items) {
    return items.length !== 0 ? ' {\n' + items.join('\n') + '\n}' : '';
}

function printArgs(options, args) {
    var indentation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

    if (args.length === 0) {
        return '';
    }

    // If every arg does not have a description, print them on one line.
    if (args.every(function (arg) {
            return !arg.description;
        })) {
        return '(' + args.map(printInputValue).join(', ') + ')';
    }

    return '(\n' + args.map(function (arg, i) {
        return printDescription(options, arg, '  ' + indentation, !i) + '  ' + indentation + printInputValue(arg);
    }).join('\n') + '\n' + indentation + ')';
}

function printInputValue(arg) {
    var defaultAST = (0, astFromValue)(arg.defaultValue, arg.type);
    var argDecl = arg.name + ': ' + String(arg.type);

    if (defaultAST) {
        argDecl += " = ".concat((0, print)(defaultAST));
    }

    return argDecl;
}

function printDirective(directive, options) {
    return printDescription(options, directive) + 'directive @' + directive.name + printArgs(options, directive.args) + (directive.isRepeatable ? ' repeatable' : '') + ' on ' + directive.locations.join(' | ');
}

function printDeprecated(fieldOrEnumVal) {
    if (!fieldOrEnumVal.isDeprecated) {
        return '';
    }

    var reason = fieldOrEnumVal.deprecationReason;
    var reasonAST = (0, astFromValue)(reason, GraphQLString);

    if (reasonAST && reason !== '' && reason !== DEFAULT_DEPRECATION_REASON) {
        return ' @deprecated(reason: ' + (0, print)(reasonAST) + ')';
    }

    return ' @deprecated';
}

function printDescription(options, def) {
    var indentation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var firstInBlock = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

    if (!def.description) {
        return '';
    }

    var lines = descriptionLines(def.description, 120 - indentation.length);

    if (options && options.commentDescriptions) {
        return printDescriptionWithComments(lines, indentation, firstInBlock);
    }

    var text = lines.join('\n');
    var preferMultipleLines = text.length > 70;
    var blockString = (0, printBlockString)(text, '', preferMultipleLines);
    var prefix = indentation && !firstInBlock ? '\n' + indentation : indentation;
    return prefix + blockString.replace(/\n/g, '\n' + indentation) + '\n';
}

function printDescriptionWithComments(lines, indentation, firstInBlock) {
    var description = indentation && !firstInBlock ? '\n' : '';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var line = _step.value;

            if (line === '') {
                description += indentation + '#\n';
            } else {
                description += indentation + '# ' + line + '\n';
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return description;
}

function descriptionLines(description, maxLen) {
    var rawLines = description.split('\n');
    return (0, _flatMap.default)(rawLines, function (line) {
        if (line.length < maxLen + 5) {
            return line;
        } // For > 120 character long lines, cut at space boundaries into sublines
        // of ~80 chars.


        return breakLine(line, maxLen);
    });
}

function breakLine(line, maxLen) {
    var parts = line.split(new RegExp("((?: |^).{15,".concat(maxLen - 40, "}(?= |$))")));

    if (parts.length < 4) {
        return [line];
    }

    var sublines = [parts[0] + parts[1] + parts[2]];

    for (var i = 3; i < parts.length; i += 2) {
        sublines.push(parts[i].slice(1) + parts[i + 1]);
    }

    return sublines;
}
