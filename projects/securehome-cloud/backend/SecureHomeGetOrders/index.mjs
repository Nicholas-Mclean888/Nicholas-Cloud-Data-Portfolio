import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({});

export const handler = async (event) => {
  try {
    // Get the authenticated user's ID from API Gateway
    const userId =
      event.requestContext?.authorizer?.jwt?.claims?.sub;

    // Reject requests without an authenticated user
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Unauthorized"
        })
      };
    }

    // Retrieve orders belonging to this customer
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: "SecureHomeOrders",
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId }
        },
        ScanIndexForward: false,
        Limit: 20
      })
    );

    // Convert DynamoDB records into JavaScript objects
    const orders = (result.Items || []).map((item) => ({
      orderId: item.orderId?.S,
      userId: item.userId?.S,
      items: (item.items?.L || []).map((product) => ({
        productId: product.M?.productId?.S,
        quantity: Number(product.M?.quantity?.N || 0)
      })),
      status: item.status?.S,
      createdAt: item.createdAt?.S
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ orders })
    };

  } catch (error) {
    console.error("Get orders failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Unable to retrieve orders"
      })
    };
  }
};