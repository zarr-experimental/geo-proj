import Ajv from 'ajv';
import fs from 'fs';

// Read command line arguments
const schemaPath = process.argv[2];
const dataPath = process.argv[3];

if (!schemaPath || !dataPath) {
  console.error('Usage: node validate.js <schema.json> <data.json>');
  process.exit(1);
}

// Read files
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Validate
const ajv = new Ajv({ allErrors: true });

// Pre-load external schema
const externalSchemaUrl = "https://proj.org/schemas/v0.7/projjson.schema.json";
const externalSchema = await fetch(externalSchemaUrl).then(r => r.json());

// Add it to ajv
ajv.addSchema(externalSchema, externalSchemaUrl);

const validate = ajv.compile(schema);
const valid = validate(data);

if (valid) {
  console.log('✅ Validation successful!');
  process.exit(0);
} else {
  console.log('❌ Validation failed!');
  console.log(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
