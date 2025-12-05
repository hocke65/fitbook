import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const TABLE_NAME = process.env.TABLE_NAME;

/**
 * DynamoDB Single Table Design:
 *
 * Entity       | PK              | SK                  | GSI1PK           | GSI1SK              | GSI2PK              | GSI2SK
 * -------------|-----------------|---------------------|------------------|---------------------|---------------------|--------
 * User         | USER#<id>       | USER#<id>           | EMAIL#<email>    | USER#<id>           | ENTRA#<entra_id>    | USER#<id>
 * Class        | CLASS#<id>      | CLASS#<id>          | CLASSES          | <scheduled_at>#<id> | -                   | -
 * Booking      | USER#<user_id>  | BOOKING#<class_id>  | CLASS#<class_id> | BOOKING#<user_id>   | -                   | -
 */

// Helper to create response
export const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});

// Get item by PK and SK
export const getItem = async (pk, sk) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  }));
  return result.Item;
};

// Put item
export const putItem = async (item) => {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));
  return item;
};

// Update item
export const updateItem = async (pk, sk, updateExpression, expressionAttributeValues, expressionAttributeNames) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };
  if (expressionAttributeNames) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }
  const result = await docClient.send(new UpdateCommand(params));
  return result.Attributes;
};

// Delete item
export const deleteItem = async (pk, sk) => {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  }));
};

// Query by PK
export const queryByPK = async (pk, skPrefix = null) => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: skPrefix
      ? 'PK = :pk AND begins_with(SK, :skPrefix)'
      : 'PK = :pk',
    ExpressionAttributeValues: skPrefix
      ? { ':pk': pk, ':skPrefix': skPrefix }
      : { ':pk': pk },
  };
  const result = await docClient.send(new QueryCommand(params));
  return result.Items || [];
};

// Query GSI1
export const queryGSI1 = async (gsi1pk, gsi1skPrefix = null, sortDesc = false) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: gsi1skPrefix
      ? 'GSI1PK = :pk AND begins_with(GSI1SK, :skPrefix)'
      : 'GSI1PK = :pk',
    ExpressionAttributeValues: gsi1skPrefix
      ? { ':pk': gsi1pk, ':skPrefix': gsi1skPrefix }
      : { ':pk': gsi1pk },
    ScanIndexForward: !sortDesc,
  };
  const result = await docClient.send(new QueryCommand(params));
  return result.Items || [];
};

// Query GSI1 with range condition (greater than)
export const queryGSI1GreaterThan = async (gsi1pk, gsi1skValue) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK > :sk',
    ExpressionAttributeValues: {
      ':pk': gsi1pk,
      ':sk': gsi1skValue,
    },
  };
  const result = await docClient.send(new QueryCommand(params));
  return result.Items || [];
};

// Query GSI2
export const queryGSI2 = async (gsi2pk) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk',
    ExpressionAttributeValues: { ':pk': gsi2pk },
  };
  const result = await docClient.send(new QueryCommand(params));
  return result.Items || [];
};

// Scan all items of a type (use sparingly - expensive)
export const scanByType = async (entityType) => {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :type',
    ExpressionAttributeValues: { ':type': entityType },
  };
  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
};

// Transact write (for atomic operations)
export const transactWrite = async (transactItems) => {
  await docClient.send(new TransactWriteCommand({
    TransactItems: transactItems.map(item => ({
      ...item,
      ...(item.Put && { Put: { ...item.Put, TableName: TABLE_NAME } }),
      ...(item.Update && { Update: { ...item.Update, TableName: TABLE_NAME } }),
      ...(item.Delete && { Delete: { ...item.Delete, TableName: TABLE_NAME } }),
      ...(item.ConditionCheck && { ConditionCheck: { ...item.ConditionCheck, TableName: TABLE_NAME } }),
    })),
  }));
};

// Conditional put (only if item doesn't exist)
export const putItemIfNotExists = async (item, conditionAttribute = 'PK') => {
  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: `attribute_not_exists(${conditionAttribute})`,
    }));
    return { success: true, item };
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return { success: false, error: 'Item already exists' };
    }
    throw error;
  }
};

export { docClient, TABLE_NAME };
