
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "node:crypto";

const dynamodb = new DynamoDBClient({});

// Trusted product catalogue. Prices are stored in Australian cents.
const products = Object.freeze({
  "camera-01": { name: "Smart Door Camera", priceCents: 12995 },
  "sensor-01": { name: "Window and Door Sensor", priceCents: 3995 },
  "motion-01": { name: "Smart Motion Detector", priceCents: 5495 },
  "hub-01": { name: "Smart Alarm Hub", priceCents: 14995 }
});

function respond(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}

export const handler = async (event) => {
  try {
    // API Gateway provides these claims after JWT validation.
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const customerId = claims?.sub;

    if (!customerId) {
      return respond(401, { message: "Authentication required" });
    }

    let body;

    try {
      body = typeof event.body === "string"
        ? JSON.parse(event.body)
        : event.body ?? {};
    } catch {
      return respond(400, { message: "Invalid JSON request" });
    }

    if (!Array.isArray(body.items) ||
        body.items.length === 0 ||
        body.items.length > 20) {
      return respond(400, {
        message: "Order must contain between 1 and 20 items"
      });
    }

    const seenProducts = new Set();
    const orderItems = [];

    for (const item of body.items) {
      if (!item || typeof item.productId !== "string" ||
          !Object.hasOwn(products, item.productId) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 || item.quantity > 100 ||
          seenProducts.has(item.productId)) {
        return respond(400, {
          message: "Invalid or duplicate product or quantity"
        });
      }

      seenProducts.add(item.productId);

      const product = products[item.productId];

      orderItems.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        lineTotalCents: product.priceCents * item.quantity
      });
    }

    const totalCents = orderItems.reduce(
      (sum, item) => sum + item.lineTotalCents, 0
    );

    const order = {
      orderId: randomUUID(),
      customerId,
      items: orderItems,
      totalCents,
      currency: "AUD",
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    await dynamodb.send(new PutItemCommand({
      TableName: process.env.ORDERS_TABLE,
      Item: {
        orderId: { S: order.orderId },
        customerId: { S: order.customerId },
        items: {
          L: order.items.map((item) => ({
            M: {
              productId: { S: item.productId },
              name: { S: item.name },
              quantity: { N: String(item.quantity) },
              unitPriceCents: { N: String(item.unitPriceCents) },
              lineTotalCents: { N: String(item.lineTotalCents) }
            }
          }))
        },
        totalCents: { N: String(order.totalCents) },
        currency: { S: order.currency },
        status: { S: order.status },
        createdAt: { S: order.createdAt }
      }
    }));

    return respond(201, {
      message: "Order saved successfully",
      order
    });

  } catch (error) {
    console.error("Create order failed:", error);
    return respond(500, { message: "Unable to create order" });
  }
};
