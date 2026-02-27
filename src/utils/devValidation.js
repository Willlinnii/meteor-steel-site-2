/**
 * Dev-mode runtime schema validation utility.
 *
 * In development (process.env.NODE_ENV === 'development'), validates that
 * canonical data files conform to expected shapes when first imported.
 * In production builds this module is a complete no-op — zero overhead.
 *
 * Usage:
 *   import { validateOnLoad } from './devValidation';
 *   validateOnLoad('planets', planetsData, {
 *     type: 'array',
 *     minLength: 7,
 *     maxLength: 7,
 *     itemShape: { number: 'number', metal: 'string', planet: 'string', day: 'string' },
 *   });
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Validate a data file against a declarative schema.
 *
 * @param {string} dataName   Human-readable label (e.g. "planets", "zodiac")
 * @param {*}      data       The imported data to validate
 * @param {object} schema     Declarative shape descriptor — see below
 *
 * Schema shapes supported:
 *
 *   Array schema:
 *   {
 *     type: 'array',
 *     minLength?: number,
 *     maxLength?: number,
 *     exactLength?: number,
 *     itemShape?: { fieldName: 'string' | 'number' | 'object' | 'boolean' | 'array', ... }
 *     itemHasKeys?: string[]          // shorthand: each item must have these keys (any type)
 *   }
 *
 *   Object schema:
 *   {
 *     type: 'object',
 *     requiredKeys?: string[],
 *     exactKeys?: string[],           // must have exactly these keys (no more, no less)
 *     valueType?: 'string' | 'object' // every value must be this type
 *     valueShape?: { fieldName: type } // every value (if object) must contain these fields
 *   }
 */
export function validateOnLoad(dataName, data, schema) {
  if (!isDev) return;

  const errors = [];
  const prefix = `[devValidation] ${dataName}`;

  if (data == null) {
    errors.push(`${prefix}: data is null or undefined`);
    reportErrors(errors);
    return;
  }

  if (schema.type === 'array') {
    validateArray(prefix, data, schema, errors);
  } else if (schema.type === 'object') {
    validateObject(prefix, data, schema, errors);
  } else {
    errors.push(`${prefix}: unknown schema type "${schema.type}"`);
  }

  reportErrors(errors);
}

// ---------------------------------------------------------------------------
// Internal validators
// ---------------------------------------------------------------------------

function validateArray(prefix, data, schema, errors) {
  if (!Array.isArray(data)) {
    errors.push(`${prefix}: expected array, got ${typeof data}`);
    return;
  }

  if (schema.exactLength != null && data.length !== schema.exactLength) {
    errors.push(`${prefix}: expected exactly ${schema.exactLength} items, got ${data.length}`);
  }
  if (schema.minLength != null && data.length < schema.minLength) {
    errors.push(`${prefix}: expected at least ${schema.minLength} items, got ${data.length}`);
  }
  if (schema.maxLength != null && data.length > schema.maxLength) {
    errors.push(`${prefix}: expected at most ${schema.maxLength} items, got ${data.length}`);
  }

  // Validate shape of each item
  if (schema.itemShape) {
    data.forEach((item, i) => {
      if (item == null || typeof item !== 'object') {
        errors.push(`${prefix}[${i}]: expected object, got ${typeof item}`);
        return;
      }
      Object.entries(schema.itemShape).forEach(([field, expectedType]) => {
        if (!(field in item)) {
          errors.push(`${prefix}[${i}]: missing required field "${field}"`);
        } else if (expectedType === 'array') {
          if (!Array.isArray(item[field])) {
            errors.push(`${prefix}[${i}].${field}: expected array, got ${typeof item[field]}`);
          }
        } else if (typeof item[field] !== expectedType) {
          errors.push(`${prefix}[${i}].${field}: expected ${expectedType}, got ${typeof item[field]}`);
        }
      });
    });
  }

  // Shorthand: just check key existence
  if (schema.itemHasKeys) {
    data.forEach((item, i) => {
      if (item == null || typeof item !== 'object') return;
      schema.itemHasKeys.forEach((key) => {
        if (!(key in item)) {
          errors.push(`${prefix}[${i}]: missing required key "${key}"`);
        }
      });
    });
  }
}

function validateObject(prefix, data, schema, errors) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push(`${prefix}: expected plain object, got ${Array.isArray(data) ? 'array' : typeof data}`);
    return;
  }

  const actualKeys = Object.keys(data);

  if (schema.exactKeys) {
    const expected = new Set(schema.exactKeys);
    const actual = new Set(actualKeys);
    schema.exactKeys.forEach((k) => {
      if (!actual.has(k)) errors.push(`${prefix}: missing required key "${k}"`);
    });
    actualKeys.forEach((k) => {
      if (!expected.has(k)) errors.push(`${prefix}: unexpected key "${k}"`);
    });
  }

  if (schema.requiredKeys) {
    schema.requiredKeys.forEach((k) => {
      if (!(k in data)) errors.push(`${prefix}: missing required key "${k}"`);
    });
  }

  if (schema.valueType) {
    actualKeys.forEach((k) => {
      if (typeof data[k] !== schema.valueType) {
        errors.push(`${prefix}["${k}"]: expected value type ${schema.valueType}, got ${typeof data[k]}`);
      }
    });
  }

  if (schema.valueShape) {
    actualKeys.forEach((k) => {
      const val = data[k];
      if (val == null || typeof val !== 'object') {
        errors.push(`${prefix}["${k}"]: expected object value for shape check, got ${typeof val}`);
        return;
      }
      Object.entries(schema.valueShape).forEach(([field, expectedType]) => {
        if (!(field in val)) {
          errors.push(`${prefix}["${k}"]: missing required field "${field}"`);
        } else if (expectedType === 'array') {
          if (!Array.isArray(val[field])) {
            errors.push(`${prefix}["${k}"].${field}: expected array, got ${typeof val[field]}`);
          }
        } else if (typeof val[field] !== expectedType) {
          errors.push(`${prefix}["${k}"].${field}: expected ${expectedType}, got ${typeof val[field]}`);
        }
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function reportErrors(errors) {
  if (errors.length === 0) return;
  console.warn(
    `\n%c DATA VALIDATION FAILED %c\n${errors.join('\n')}`,
    'background: #cc3300; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
    ''
  );
}
