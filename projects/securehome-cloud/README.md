# SecureHome Cloud

SecureHome Cloud is a serverless e-commerce application designed for customers to browse and order home-security products. The project demonstrates how AWS managed services can be combined to create a secure, scalable and cost-conscious cloud solution.

## Project Objectives

* Build a practical serverless e-commerce application.
* Use AWS managed services wherever possible.
* Apply security, monitoring and cost-management principles.
* Keep development costs within the AWS Free Tier where practical.
* Demonstrate cloud architecture skills to prospective employers.

## Proposed Features

* Browse home-security products.
* Create and sign in to a customer account.
* Add products to a shopping cart.
* Submit and process an order.
* Store product and order information.
* Send order-status notifications.
* Monitor application health, security and cost.

## Architecture

The application uses a serverless architecture so that resources can scale according to demand without requiring permanent virtual servers.

### Front End

* **Amazon S3** stores the static website files.
* **Amazon CloudFront** securely distributes the website to users.
* **AWS Shield Standard** provides basic protection against common distributed denial-of-service attacks.

### Authentication

* **Amazon Cognito** manages customer registration, sign-in and authentication.

### Application and API Layer

* **Amazon API Gateway** provides secure API endpoints for the website.
* **AWS Lambda** runs the application logic without dedicated servers.

### Data and Encryption

* **Amazon DynamoDB** stores product, customer-cart and order data.
* **AWS KMS** supports encryption and secure management of encryption keys.

### Order Processing

* **Amazon SQS** queues order-processing tasks.
* **AWS Step Functions** coordinates the order workflow.
* **Amazon SNS** sends order and system notifications.

### Monitoring and Cost Control

* **Amazon CloudWatch** collects application logs and operational metrics.
* **AWS IAM** applies permissions using the principle of least privilege.
* **AWS Budgets** provides alerts before spending exceeds the defined budget.

## Simplified Request Flow

1. A customer opens the website through CloudFront.
2. CloudFront retrieves the static website from Amazon S3.
3. Amazon Cognito authenticates the customer.
4. The website sends requests through Amazon API Gateway.
5. AWS Lambda processes the application request.
6. Product and order data is read from or written to DynamoDB.
7. SQS and Step Functions coordinate order processing.
8. SNS sends notifications.
9. CloudWatch records logs and metrics.

## Security Considerations

* Customer authentication is handled through Amazon Cognito.
* IAM permissions will follow the principle of least privilege.
* Data will be encrypted in transit and at rest.
* Sensitive credentials will not be stored in the source code.
* CloudWatch logs will support monitoring and troubleshooting.
* Public access to the S3 origin will be restricted through CloudFront.
* AWS budget alerts will help identify unexpected usage or cost.

## Cost Management

This project is designed to use the AWS Free Tier wherever practical. AWS Budgets and notifications have been configured to provide early warnings of unexpected charges.

Resources will be monitored regularly, and unused development resources will be removed when they are no longer required.

## Project Progress

* [x] Define the project idea and requirements
* [x] Configure AWS budget alerts
* [x] Design the AWS architecture
* [ ] Create the website interface
* [ ] Configure authentication
* [ ] Create the product database
* [ ] Develop API and Lambda functions
* [ ] Build the order-processing workflow
* [ ] Configure monitoring and security
* [ ] Test the complete application
* [ ] Document results and lessons learned

## Skills Demonstrated

* Serverless AWS architecture
* Cloud security fundamentals
* Identity and access management
* NoSQL database design
* API design
* Event-driven application design
* Monitoring and cost control
* Technical documentation

## Project Status

**In development**
