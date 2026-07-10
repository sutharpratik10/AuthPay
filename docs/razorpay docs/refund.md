---
title: Razorpay Refunds APIs
heading: Refunds
description: Initiate normal and instant refunds to your customers using Razorpay Refund APIs. View and update refund using APIs.
---

# Refunds

Make full or partial refunds to customers. You can initiate refunds only on those payments that are in `captured` state. A payment in `authorized` state is auto-refunded if not `captured` within 3 days of creation. You can create and manage refunds using APIs or from the [Dashboard](https://razorpay.com/docs/build/llm-docs/payments/refunds.md#dashboard-actions).

Fork the Razorpay Postman Public Workspace and try the Refunds APIs using your [Test API Keys](https://razorpay.com/docs/build/llm-docs/api/authentication.md#generate-api-keys).

[](https://www.postman.com/razorpaydev/workspace/razorpay-public-workspace/folder/12492020-49fdb1f6-7e7d-426c-b7b4-3dd468d8565e)

### Related Guides

[About Refunds](https://razorpay.com/docs/build/llm-docs/payments/refunds.md)
[Set Up Webhooks](https://razorpay.com/docs/build/llm-docs/webhooks/setup-edit-payments.md)
[Sample Payloads](https://razorpay.com/docs/build/llm-docs/webhooks/refunds.md)

### Endpoints

- **post** `/v1/payments/:id/refund` - Create a Normal Refund: 
 Creates a normal refund for a payment.

- **post** `/v1/payments/:id/refund` - Create a Normal Refund (Idempotent Request): 
 Retry or send the same normal refund request multiple times safely by creating a normal refund idempotency request.

- **post** `/v1/payments/:id/refund` - Create an Instant Refund: 
 Creates an instant refund for a payment.

- **post** `/v1/payments/:id/refund` - Create an Instant Refund (Idempotent Request): 
 Retry or send the same instant refund request multiple times safely by creating an instant refund idempotency request.

- **get** `/v1/payments/:id/refunds` - Fetch Multiple Refunds for a Payment: 
 Retrieves multiple refunds for a payment.

- **get** `/v1/payments/:payment_id/refunds/:refund_id` - Fetch a Specific Refund for a Payment: 
 Retrieves details of a specific refund made for a payment.

- **get** `/v1/refunds/` - Fetch All Refunds: 
 Retrieves details of all refunds.

- **get** `/v1/refunds/:id` - Fetch Refund With ID: 
 Retrieves the refund using the id.

- **patch** `/v1/refunds/:id/` - Update a Refund: 
 Updates the `notes` parameter for a refund.


---
title: Refunds Entity
description: Know about refunds entity parameters and their description.
---

# Refunds Entity

The Refunds entity has the following parameters:

### Response

```json: Entity
{
  "id":"rfnd_FgRAHdNOM4ZVbO",
  "entity":"refund",
  "amount":10000,
  "currency":"INR",
  "payment_id":"pay_FgR9UMzgmKDJRi",
  "notes":{
    "notes_key_1":"Beam me up Scotty.",
    "notes_key_2":"Engage"
  },
  "receipt":null,
  "acquirer_data":{
    "arn":"10000000000000"
  },
  "created_at":1600856650,
  "batch_id":null,
  "status":"processed",
  "speed_processed":"normal",
  "speed_requested":"normal"
}
```

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). For example, if the refund value is 30 it will be `3000`. In the case of three decimal currencies, such as KWD, BHD and OMR, to refund a payment of 295.991, pass the value as `295990`. And in the case of zero decimal currencies such as JPY, to refund a payment of 295, pass the value as `295`.

  
**WARN**

**Watch Out!**

As per payment guidelines, you should pass the last decimal number as 0 for three decimal currency payments. For example, if you want to refund a customer 99.991 KD for a transaction, you should pass the value for the amount parameter as `99990` and not `99991`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

  
**INFO**

**Handy Tips**

Razorpay has added support for zero decimal currencies, such as JPY, and three decimal currencies, such as KWD, BHD, and OMR, allowing businesses to accept international payments in these currencies. Know more about [Currency Conversion](https://razorpay.com/docs/build/llm-docs/payments/international-payments/currency-conversion.md) (May 2024).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty”`.

`speed`
: `string` Speed at which the refund is to be processed. Possible value is `normal`, which indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `array` A dynamic array consisting of a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.


---
title: Create a Normal Refund
description: Create a Normal Refund using Razorpay Refunds API.
---

# Create a Normal Refund

**POST** `/v1/payments/:id/refund`

Use this endpoint to create a normal refund for a payment.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X POST https://api.razorpay.com/v1/payments/pay_29QQoUBi66xm2f/refund \
-H 'Content-Type: application/json' \
-d '{
  "amount": 500100
}'

```java: Java
RazorpayClient razorpay = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

String paymentId = "pay_29QQoUBi66xm2f";

JSONObject refundRequest = new JSONObject();
refundRequest.put("amount",100);
refundRequest.put("speed","normal");
JSONObject notes = new JSONObject();
notes.put("notes_key_1","Tea, Earl Grey, Hot");
notes.put("notes_key_2","Tea, Earl Grey… decaf.");
refundRequest.put("notes",notes);
refundRequest.put("receipt","Receipt No. #31");
              
Payment payment = razorpay.payments.refund(paymentId,refundRequest);

```php: PHP
$api = new Api($key_id, $secret);

$api->payment->fetch($paymentId)->refund(array("amount"=> "100", "speed"=>"normal", "notes"=>array("notes_key_1"=>"Beam me up Scotty.", "notes_key_2"=>"Engage"), "receipt"=>"Receipt No. 31"));

```python: Python
import razorpay
client = razorpay.Client(auth=("YOUR_ID", "YOUR_SECRET"))

client.payment.refund(paymentId,{
  "amount": "100",
  "speed": "normal",
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  },
  "receipt": "Receipt No. 31"
})

```go: Go
import ( razorpay "github.com/razorpay/razorpay-go" )
client := razorpay.NewClient("YOUR_KEY_ID", "YOUR_SECRET")

data := map[string]interface{}{
  "speed": "normal",
  "notes": map[string]interface{}{
    "key_1": "value1",
    "key_2": "value2"
  },
}
body, err := client.Payment.Refund("",1200, data, nil)

```javascript: Node.js
var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

instance.payments.refund(paymentId,{
  "amount": "100",
  "speed": "normal",
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  },
  "receipt": "Receipt No. 31"
})

```csharp: .NET
//initialize the SDK client
RazorpayClient client = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

string paymentId = "pay_Z6t7VFTb9xHeOs";

Dictionary refundRequest = new Dictionary();
refundRequest.Add("amount", 200);
refundRequest.Add("speed", "normal");
Dictionary notes = new Dictionary();
notes.Add("notes_key_1", "Tea, Earl Grey, Hot");
notes.Add("notes_key_2", "Tea, Earl Grey… decaf.");
refundRequest.Add("notes", notes);
refundRequest.Add("receipt", "Receipt No. #32");

Refund refund = client.Payment.Fetch(paymentId).Refund(refundRequest);

```ruby: Ruby
require "razorpay"
Razorpay.setup('YOUR_KEY_ID', 'YOUR_SECRET')

paymentId = "pay_29QQoUBi66xm2f"

para_attr = {
  "amount": "100",
  "speed": "normal",
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  },
  "receipt": "Receipt No. 31"
}

Razorpay::Payment.fetch(paymentId).refund(para_attr)

```bash: CLI
razorpay refunds create pay_ABC123 --amount 50000 --note key1="Test refund"
```

### Response

```json: Success
{
  "id": "rfnd_FP8QHiV938haTz",
  "entity": "refund",
  "amount": 500100,
  "receipt": "Receipt No. 31",
  "currency": "INR",
  "payment_id": "pay_29QQoUBi66xm2f",
  "notes": [],
  "receipt": null,
  "acquirer_data": {
    "arn": null
  },
  "created_at": 1597078866,
  "batch_id": null,
  "status": "processed",
  "speed_processed": "normal",
  "speed_requested": "normal"
}
```json: Failure
{
    "error": {
        "code": "BAD_REQUEST_ERROR",
        "description": "The amount must be at least INR 1.00",
        "source": "business",
        "step": "payment_initiation",
        "reason": "input_validation_failed",
        "metadata": {},
        "field": "amount"
    }
}
```

### Parameters

`id` _mandatory_
: `string` The unique identifier of the payment which needs to be refunded.

### Parameters

`amount` _optional_
: `integer` The amount to be refunded. Amount should be in the smallest unit of the currency in which the payment was made. In the case of three decimal currencies, such as KWD, BHD and OMR, to refund a payment of 295.991, pass the value as `295990`. And in the case of zero decimal currencies such as JPY, to refund a payment of 295, pass the value as `295`.
  - For a **partial refund**, enter a value lesser than the payment amount. For example, if the payment amount is 1500 and you want to refund only 500, you must pass `50000`.
  - For **full refund**, enter the entire payment amount. If the `amount` parameter is not passed, the entire payment amount will be refunded.

  
**WARN**

**Watch Out!**

As per payment guidelines, you should pass the last decimal number as 0 for three decimal currency payments. For example, if you want to refund a customer 99.991 KD for a transaction, you should pass the value for the amount parameter as `99990` and not `99991`.

`speed` _optional_
: `string` The speed at which the refund is to be processed. The default value is `normal`. Refund will be processed via the normal speed, and the customer will receive the refund within 5-7 working days.

`notes` _optional_
: `json object` Key-value pairs used to store additional information. A maximum of 15 key-value pairs can be included.

`receipt` _optional_
: `string` A unique identifier provided by you for your internal reference.

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). 
 For example, if the refund value is 30 it will be `3000`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty"`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `array` A dynamic array consisting of a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

The API \{key/secret\} provided is invalid.
* code: 4xx
* description: The API credentials passed in the API call differ from the ones generated on the Dashboard.
* solution: The API keys must be active and entered correctly with no whitespace before or after.

\{Payment_id\} is not a valid id.
* code: 400
* description: The `payment_id` provided is invalid.
* solution: Use a valid `payment_id`.

The requested URL was not found on the server.
* code: 400
* description: Possible reasons: - The URL is wrong or is missing something.
- A POST API is executed by GET method.

* solution: - Ensure that the URL is correct and complete.
- Use the correct method, that is, POST.

\{any Extra field\} is/are not required and should not be sent.
* code: 400
* description: An additional or unrequired parameter is passed.
* solution: Ensure that you only pass the required parameters in the request body.

The refund amount provided is greater than amount captured.
* code: 400
* description: The refund amount entered is more than the amount captured.
* solution: Enter an amount equal to or less than the amount captured.

The amount must be at least INR 1.00.
* code: 400
* description: The refund amount entered is less than .
* solution: Enter an amount of at least .

The payment has been fully refunded already.
* code: 400
* description: The `payment_id` has already been refunded fully.
* solution: Use a `payment_id` that has not been fully refunded.

The amount must be an integer.
* code: 400
* description: A non-integer value (for example a string or a decimal) was passed for the `amount` field.
* solution: Pass `amount` as an integer in currency subunits (for example, `100` for ₹1.00).

The selected speed is invalid.
* code: 400
* description: An unsupported value was passed for the `speed` field.
* solution: Use one of the supported values: `normal` or `optimum`.

Your account does not have enough balance to carry out the refund operation.
* code: 400
* description: The merchant's Razorpay balance is lower than the refund amount being requested. Refunds are paid out from the merchant balance, not directly from the original payment.
* solution: Add funds to your Razorpay account from the Dashboard or capture additional payments to increase your balance, then retry the refund.

The payment status should be captured for action to be taken.
* code: 400
* description: The payment is not in the `captured` state. This typically happens because it failed, is still `authorized`, was `cancelled` or has already been fully refunded. Refunds can only be initiated against payments that are currently in the `captured` state.
* solution: Confirm the payment status using `GET /v1/payments/:id` before refunding. Only attempt refunds on payments where `status` is `captured`.

Amount cannot be blank.
* code: 400
* description: The `amount` field was passed as `0`. Razorpay treats `0` as a missing value rather than a zero-amount refund. Omitting `amount` is valid and triggers a full refund.
* solution: Pass `amount` as a positive integer in currency subunits (paise for INR).


---
title: Create a Normal Refund (Idempotent Request)
description: Retry or send the same normal refund request multiple times safely using the Razorpay API.
---

# Create a Normal Refund (Idempotent Request)

**POST** `/v1/payments/:id/refund`

Idempotency allows you to safely retry or send the same request multiple times without fear of repeating the normal refund request more than once.

- When you try to create a normal refund, in some cases due to network downtimes, you may not get a response from our servers. As a consequence, you will not be aware of the refund id or its state. In such cases, you can safely retry the transaction using the same idempotency key without risk of double-refund or duplication.
- To make a normal refund request idempotent, add the header `X-Refund-Idempotency` to the request and pass an idempotency key against it. The idempotency key must be at least 10 character long and can contain alphabets, numbers, hyphens and underscores only. For example, `550e8400-e29b-41d4-a716-446655440000`.
- Idempotency is supported for both Normal and Instant Refunds APIs.

**INFO**

**Handy Tips**

- When retrying a request, the request body must be the same as the first request for idempotency to work. A different payload will be rejected as a `BAD_REQUEST`.
- The idempotency key in retries must be the same as the original request.
- Use unique idempotency keys for each unique request.
- If a request is received while a prior request is still being processed, the system will return a 409 Conflict status code. You may retry the request upon receiving this response.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X POST https://api.razorpay.com/v1/payments/pay_29QQoUBi66xm2f/refund \
-H 'Content-Type: application/json' \
-H 'X-Refund-Idempotency: 550e8400-e29b-41d4-a716-446655440000' \
-d '{
  "amount": 500100
}'

```bash: CLI
razorpay refunds create pay_ABC123 --amount 500100 --idempotency-key 550e8400-e29b-41d4-a716-446655440000
```

### Response

```json: Success
{
  "id": "rfnd_FP8QHiV938haTz",
  "entity": "refund",
  "amount": 500100,
  "receipt": "Receipt No. 31",
  "currency": "INR",
  "payment_id": "pay_29QQoUBi66xm2f",
  "notes": {},
  "acquirer_data": {
    "arn": null
  },
  "created_at": 1597078866,
  "batch_id": null,
  "status": "processed",
  "speed_processed": "normal",
  "speed_requested": "normal"
}
```json: Failure
{
  "error": {
    "code": "BAD_REQUEST_ERROR",
    "description": "Different request with the same idempotency key has already been processed.",
    "source": "NA",
    "step": "NA",
    "reason": "NA",
    "metadata": {}
  }
}
```

### Parameters

`id` _mandatory_
: `string` The unique identifier of the payment which needs to be refunded.

### Parameters

`amount` _optional_
: `integer` The amount to be refunded. Amount should be in the smallest unit of the currency in which the payment was made. In the case of three decimal currencies, such as KWD, BHD and OMR, to refund a payment of 295.991, pass the value as `295990`. And in the case of zero decimal currencies such as JPY, to refund a payment of 295, pass the value as `295`.
  - For a **partial refund**, enter a value lesser than the payment amount. For example, if the payment amount is 1500 and you want to refund only 500, you must pass `50000`.
  - For **full refund**, enter the entire payment amount. If the `amount` parameter is not passed, the entire payment amount will be refunded.

  
**WARN**

**Watch Out!**

As per payment guidelines, you should pass the last decimal number as 0 for three decimal currency payments. For example, if you want to refund a customer 99.991 KD for a transaction, you should pass the value for the amount parameter as `99990` and not `99991`.

`speed` _optional_
: `string` The speed at which the refund is to be processed. The default value is `normal`. Refund will be processed via the normal speed, and the customer will receive the refund within 5-7 working days.

`notes` _optional_
: `json object` Key-value pairs used to store additional information. A maximum of 15 key-value pairs can be included.

`receipt` _optional_
: `string` A unique identifier provided by you for your internal reference.

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). 
 For example, if the refund value is 30 it will be `3000`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty"`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `array` A dynamic array consisting of a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

The API \{key/secret\} provided is invalid.
* code: 4xx
* description: The API credentials passed in the API call differ from the ones generated on the Dashboard.
* solution: The API keys must be active and entered correctly with no whitespace before or after.

\{Payment_id\} is not a valid id.
* code: 400
* description: The `payment_id` provided is invalid.
* solution: Use a valid `payment_id`.

The requested URL was not found on the server.
* code: 400
* description: Possible reasons: - The URL is wrong or is missing something.
- A POST API is executed by GET method.

* solution: - Ensure that the URL is correct and complete.
- Use the correct method, that is, POST.

\{any Extra field\} is/are not required and should not be sent.
* code: 400
* description: An additional or unrequired parameter is passed.
* solution: Ensure that you only pass the required parameters in the request body.

The refund amount provided is greater than amount captured.
* code: 400
* description: The refund amount entered is more than the amount captured.
* solution: Enter an amount equal to or less than the amount captured.

The amount must be at least INR 1.00.
* code: 400
* description: The refund amount entered is less than .
* solution: Enter an amount of at least .

The payment has been fully refunded already.
* code: 400
* description: The `payment_id` has already been refunded fully.
* solution: Use a `payment_id` that has not been fully refunded.

Different request with the same idempotency key has already been processed.
* code: 409
* description: Another refund request with different parameters has been processed using the same idempotency key.
* solution: Use a unique idempotency key for the new request and retry.

Another request with the same idempotency key is still in progress.
* code: 409
* description: A refund request with the same idempotency key is currently being processed and has not yet returned a response.
* solution: Wait for the previous request to complete or use a different idempotency key.

Internal server error - Failed to fetch idempotency record
* code: 500
* description: The server encountered an error while retrieving the idempotency record.
* solution: Retry the request after some time. If the issue persists, contact [Razorpay Support](https://razorpay.com/support).

Internal server error - Failed to parse request body
* code: 500
* description: The server failed to parse the request body to generate the request hash.
* solution: Ensure the request body is properly formatted as valid JSON. If the issue persists, contact [Razorpay Support](https://razorpay.com/support).

The idempotency key must be at least 10 characters long.
* code: 400
* description: The idempotency key provided is less than 10 characters in length.
* solution: Use an idempotency key that is at least 10 characters long.

The idempotency key must only contain alphanumeric characters, underscores, and hyphens
* code: 400
* description: The idempotency key contains invalid special characters.
* solution: Ensure the idempotency key only contains alphanumeric characters (A-Z, a-z, 0-9), underscores (_), and hyphens (-).

Merchant id not found in authentication
* code: 500
* description: The request contains an idempotency key but the merchant authentication is invalid or missing.
* solution: Ensure you are using valid API credentials (Key ID and Key Secret) for authentication. If the issue persists, contact [Razorpay Support](https://razorpay.com/support).


---
title: Create an Instant Refund
description: Create an Instant Refund using Razorpay Refunds API.
---

# Create an Instant Refund

**POST** `/v1/payments/:id/refund`

Use this endpoint to process refunds instantaneously to your customers. The instant refund is enabled by default for your account. You should set the refund speed to `optimum` when creating a refund request to ensure refunds are processed instantly. We will consider the default speed if you do not specify the same during the refund request. Know more about [setting the default speed](https://razorpay.com/docs/build/llm-docs/payments/refunds/refund-speed.md) from the Dashboard.

- Refunds will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
-  If the refund can be processed instantly, Razorpay will do so irrespective of the payment method used to make the payment.

**`speed` attribute in Request** | **`speed_processed` attribute in Response** | **Description**
---
`normal` | `normal` | Refund processed via `normal` speed.
---
`optimum` | `normal` | A faster speed was not available, so processed via `normal` speed.

Once the refund moves to the `processed` state, the refund response displays the `speed_processed` parameter, the final state of the refund.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X POST https://api.razorpay.com/v1/payments/pay_29QQoUBi66xm2f/refund \
-H 'Content-Type: application/json' \
-d '{
  "amount":500100,
  "speed":"optimum",
  "receipt":"Receipt No. 31",
  "notes":{
    "notes_key_1":"Tea, Earl Grey, Hot",
    "notes_key_2":"Tea, Earl Grey… decaf."
  }
}'

```java: Java
RazorpayClient razorpay = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

String paymentId = "pay_29QQoUBi66xm2f";

JSONObject refundRequest = new JSONObject();
refundRequest.put("amount",100);
refundRequest.put("speed","optimum");
refundRequest.put("receipt","Receipt No. #31");
JSONObject notes = new JSONObject();
notes.put("notes_key_1","Tea, Earl Grey, Hot");
notes.put("notes_key_2","Tea, Earl Grey… decaf.");
refundRequest.put("notes",notes);
              
Payment payment = razorpay.payments.refund(paymentId,refundRequest);

```php: PHP
$api = new Api($key_id, $secret);

$api->payment->fetch($paymentId)->refund(array("amount"=> "100","speed"=>"optimum","notes"=>array("notes_key_1"=>"Beam me up Scotty.", "notes_key_2"=>"Engage"),"receipt"=>"Receipt No. 31"));

```python: Python
import razorpay
client = razorpay.Client(auth=("YOUR_ID", "YOUR_SECRET"))

client.payment.refund(paymentId,{
  "amount": "100",
  "speed": "optimum",
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  },
  "receipt": "Receipt No. 31"
})

```go: Go
import ( razorpay "github.com/razorpay/razorpay-go" )
client := razorpay.NewClient("YOUR_KEY_ID", "YOUR_SECRET")

data := map[string]interface{}{
	"speed": "optimum",
  "notes": map[string]interface{}{
    "key_1": "value1",
    "key_2": "value2"
  },
	"receipt": "Receipt No. #12",
}
body, err := client.Payment.Refund("",100, data, nil)

```ruby: Ruby
require "razorpay"
Razorpay.setup('YOUR_KEY_ID', 'YOUR_SECRET')

paymentId = "pay_29QQoUBi66xm2f"

para_attr = {
  "amount": "100",
  "speed": "optimum",
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  },
  "receipt": "Receipt No. 31"
}
Razorpay::Payment.fetch(paymentId).refund(para_attr)

```javascript: Node.js
var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

instance.payments.refund(paymentId,{
  "amount": "100",
  "speed": "optimum",
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  },
  "receipt": "Receipt No. 31"
})

```csharp: .NET
//initialize the SDK client
RazorpayClient client = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

String paymentId = "pay_Z6t7VFTb9xHeOs";

Dictionary refundRequest = new Dictionary();
refundRequest.Add("amount",100);
refundRequest.Add("speed","optimum");
Dictionary notes = new Dictionary();
notes.Add("notes_key_1", "Tea, Earl Grey, Hot");
notes.Add("notes_key_2", "Tea, Earl Grey… decaf.");
refundRequest.Add("notes", notes);
refundRequest.Add("receipt","Receipt No. 31");

Refund refund = client.Payment.Fetch(paymentId).Refund(refundRequest);

```bash: CLI
razorpay refunds create pay_ABC123 --amount 50000 --speed optimum
```

### Response

```json: Success
{
  "id": "rfnd_FP8R8EGjGbPkVb",
  "entity": "refund",
  "amount": 500100,
  "currency": "INR",
  "payment_id": "pay_29QQoUBi66xm2f",
  "notes": {
    "notes_key_1": "Tea, Earl Grey, Hot",
    "notes_key_2": "Tea, Earl Grey… decaf."
  },
  "receipt": "Receipt No. 31",
  "acquirer_data": {
    "arn": null
  },
  "created_at": 1597078914,
  "batch_id": null,
  "status": "processed",
  "speed_processed": "normal",
  "speed_requested": "optimum"
}
```json: Failure
{
    "error": {
        "code": "BAD_REQUEST_ERROR",
        "description": "_29QQoUBi66xm2f is not a valid id",
        "source": "business",
        "step": "payment_initiation",
        "reason": "input_validation_failed",
        "metadata": {}
    }
}
```

### Parameters

`id` _mandatory_
: `string` The unique identifier of the payment which needs to be refunded.

### Parameters

`amount` _optional_
: `integer` The amount to be refunded. Amount should be in the smallest unit of the currency in which the payment was made. **Required in case of partial refund**.
  - For a **partial refund**, enter a value lesser than the payment amount. For example, if the payment amount is ₹1200, and you want to refund only ₹200, you must pass `20000`.
  - In case of a **full refund**, enter the full payment amount. If `amount` parameter is not passed, the entire payment amount will be refunded.

  
  
**SUCCESS**

**What's New**

Refund amounts of ₹1 or lower are now supported.

  

`speed` _mandatory_
: `string` Here, it must be `optimum`. Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
    - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
    - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`notes` _optional_
: `json object` This is a key-value pair that can be used to store additional information about the entity. It can hold a maximum of 15 key-value pairs, 256 characters (maximum) each. For example, `"note_key": "Beam me up Scotty”`.

`receipt` _optional_
: `string` A unique identifier provided by you for your internal reference.

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). 
 For example, if the refund value is 30 it will be `3000`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty”`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `array` A dynamic array consisting of a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

The API \{key/secret\} provided is invalid.
* code: 4xx
* description: The API credentials passed in the API call differ from the ones generated on the Dashboard.
* solution: The API keys must be active and entered correctly with no whitespace before or after.

\{Payment_id\} is not a valid id.
* code: 400
* description: The `payment_id` provided is invalid.
* solution: Use a valid `payment_id`.

The requested URL was not found on the server.
* code: 400
* description: Possible reasons: - The URL is wrong or is missing something.
- A POST API is executed by GET method.

* solution: - Ensure that the URL is correct and complete.
- Use the correct method, that is, POST.

\{any Extra field\} is/are not required and should not be sent.
* code: 400
* description: An additional or unrequired parameter is passed.
* solution: Ensure that you only pass the required parameters in the request body.

The refund amount provided is greater than amount captured.
* code: 400
* description: The refund amount entered is more than the amount captured.
* solution: Enter an amount equal to or less than the amount captured.

The payment has been fully refunded already.
* code: 400
* description: The `payment_id` has already been refunded fully.
* solution: Use a `payment_id` that has not been fully refunded.

Your account does not have enough balance to carry out the refund operation.
* code: 400
* description: The merchant's Razorpay balance is lower than the refund amount being requested. Refunds are paid out from the merchant balance, not directly from the original payment.
* solution: Add funds to your Razorpay account from the Dashboard or capture additional payments to increase your balance, then retry the refund.

The payment status should be captured for action to be taken.
* code: 400
* description: The payment is not in the `captured` state. This typically happens because it failed, is still `authorized`, was `cancelled` or has already been fully refunded. Refunds can only be initiated against payments that are currently in the `captured` state.
* solution: Confirm the payment status using `GET /v1/payments/:id` before refunding. Only attempt refunds on payments where `status` is `captured`.

Amount cannot be blank.
* code: 400
* description: The `amount` field was passed as `0`. Razorpay treats `0` as a missing value rather than a zero-amount refund. Omitting `amount` is valid and triggers a full refund.
* solution: Pass `amount` as a positive integer in currency subunits (paise for INR).


---
title: Create an Instant Refund (Idempotent Request)
description: Retry or send the same instant refund request multiple times safely using the Razorpay API.
---

# Create an Instant Refund (Idempotent Request)

**POST** `/v1/payments/:id/refund`

Idempotency allows you to safely retry or send the same request multiple times without fear of repeating the instant refund request more than once.

- When you try to create an instant refund, in some cases due to network downtimes, you may not get a response from our servers. As a consequence, you will not be aware of the refund id or its state. In such cases, you can safely retry the transaction using the same idempotency key without risk of double-refund or duplication.
- To make an instant refund request idempotent, add the header `X-Refund-Idempotency` to the request and pass an idempotency key against it. The idempotency key must be at least 10 character long and can contain alphabets, numbers, hyphens and underscores only. For example, `550e8400-e29b-41d4-a716-446655440000`.
- Idempotency is supported for both Normal and Instant Refunds APIs.

**INFO**

**Handy Tips**

- When retrying a request, the request body must be the same as the first request for idempotency to work. A different payload will be rejected as a `BAD_REQUEST`.
- The idempotency key in retries must be the same as the original request.
- Use unique idempotency keys for each unique request.
- If a request is received while a prior request is still being processed, the system will return a 409 Conflict status code. You may retry the request upon receiving this response.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X POST https://api.razorpay.com/v1/payments/pay_29QQoUBi66xm2f/refund \
-H 'Content-Type: application/json' \
-H 'X-Refund-Idempotency: 550e8400-e29b-41d4-a716-446655440000' \
-d '{
  "amount":500100,
  "speed":"optimum",
  "receipt":"Receipt No. 31",
  "notes":{
    "notes_key_1":"Tea, Earl Grey, Hot",
    "notes_key_2":"Tea, Earl Grey… decaf."
  }
}'

```bash: CLI
razorpay refunds create pay_ABC123 --amount 500100 --speed optimum --idempotency-key 550e8400-e29b-41d4-a716-446655440000
```

### Response

```json: Success
{
  "id": "rfnd_FP8R8EGjGbPkVb",
  "entity": "refund",
  "amount": 500100,
  "currency": "INR",
  "payment_id": "pay_29QQoUBi66xm2f",
  "notes": {
    "notes_key_1": "Tea, Earl Grey, Hot",
    "notes_key_2": "Tea, Earl Grey… decaf."
  },
  "receipt": "Receipt No. 31",
  "acquirer_data": {
    "arn": null
  },
  "created_at": 1597078914,
  "batch_id": null,
  "status": "processed",
  "speed_processed": "normal",
  "speed_requested": "optimum"
}
```json: Failure
{
  "error": {
    "code": "BAD_REQUEST_ERROR",
    "description": "Different request with the same idempotency key has already been processed.",
    "source": "NA",
    "step": "NA",
    "reason": "NA",
    "metadata": {}
  }
}

```

### Parameters

`id` _mandatory_
: `string` The unique identifier of the payment which needs to be refunded.

### Parameters

`amount` _optional_
: `integer` The amount to be refunded. Amount should be in the smallest unit of the currency in which the payment was made. **Required in case of partial refund**.
  - For a **partial refund**, enter a value lesser than the payment amount. For example, if the payment amount is ₹1200 and you want to refund only ₹200, you must pass `20000`.
  - In case of a **full refund**, enter the full payment amount. If `amount` parameter is not passed, the entire payment amount will be refunded.

`speed` _mandatory_
: `string` Here, it must be `optimum`. Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
    - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
    - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`notes` _optional_
: `json object` This is a key-value pair that can be used to store additional information about the entity. It can hold a maximum of 15 key-value pairs, 256 characters (maximum) each. For example, `"note_key": "Beam me up Scotty”`.

`receipt` _optional_
: `string` A unique identifier provided by you for your internal reference.

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). 
 For example, if the refund value is 30 it will be `3000`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty”`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `array` A dynamic array consisting of a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

Different request with the same idempotency key has already been processed.
* code: 409
* description: Another refund request with different parameters has been processed using the same idempotency key.
* solution: Use a unique idempotency key for the new request and retry.

Another request with the same idempotency key is still in progress.
* code: 409
* description: A refund request with the same idempotency key is currently being processed and has not yet returned a response.
* solution: Wait for the previous request to complete or use a different idempotency key.

Internal server error - Failed to fetch idempotency record
* code: 500
* description: The server encountered an error while retrieving the idempotency record.
* solution: Retry the request after some time. If the issue persists, contact [Razorpay Support](https://razorpay.com/support).

Internal server error - Failed to parse request body
* code: 500
* description: The server failed to parse the request body to generate the request hash.
* solution: Ensure the request body is properly formatted as valid JSON. If the issue persists, contact [Razorpay Support](https://razorpay.com/support).

The idempotency key must be at least 10 characters long.

* code: 400
* description: The idempotency key provided is less than 10 characters in length.
* solution: Use an idempotency key that is at least 10 characters long.

The idempotency key must only contain alphanumeric characters, underscores and hyphens.

* code: 400
* description: The idempotency key contains invalid special characters.
* solution: Ensure the idempotency key only contains alphanumeric characters (A-Z, a-z, 0-9), underscores (_) and hyphens (-).

Merchant id not found in authentication
* code: 500
* description: The request contains an idempotency key but the merchant authentication is invalid or missing.
* solution: Ensure you are using valid API credentials (Key ID and Key Secret) for authentication. If the issue persists, [Razorpay Support](https://razorpay.com/support).


---
title: Fetch Multiple Refunds for a Payment
description: Fetch Multiple Refunds for a Payment using Razorpay Refunds API.
---

# Fetch Multiple Refunds for a Payment

**GET** `/v1/payments/:id/refunds`

Use this endpoint to retrieve multiple refunds for a payment. By default, only the last 10 refunds are returned. You can use `count` and `skip` parameters to change that behaviour.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X GET https://api.razorpay.com/v1/payments/pay_29QQoUBi66xm2f/refunds?from=1500826740&to=1500826760

```java: Java
RazorpayClient razorpay = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

String paymentId = "pay_29QQoUBi66xm2f";

JSONObject params = new JSONObject();
params.put("count","1");
 
List payments = razorpay.payments.fetchAllRefunds(paymentId,params);

```php: PHP
$api = new Api($key_id, $secret);

$api->payment->fetch($paymentId)->fetchMultipleRefund($option);

```python: Python
import razorpay
client = razorpay.Client(auth=("YOUR_ID", "YOUR_SECRET"))

client.payment.fetch_multiple_refund(paymentId,option)

```go: Go
import ( razorpay "github.com/razorpay/razorpay-go" )
client := razorpay.NewClient("YOUR_KEY_ID", "YOUR_SECRET")

option := map[string]interface{}{
    "count" : 1,
}
body, err := client.Payment.FetchMultipleRefund("",option, nil)

```ruby: Ruby
require "razorpay"
Razorpay.setup('YOUR_KEY_ID', 'YOUR_SECRET')

paymentId = "pay_29QQoUBi66xm2f"

option = {"count":1}

Razorpay::Payment.fetch_multiple_refund(paymentId,option)

```javascript: Node.js
var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

instance.payments.fetchMultipleRefund(paymentId,option)

```csharp: .NET
//initialize the SDK client
RazorpayClient client = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

String paymentId = "pay_Z6t7VFTb9xHeOs";

Dictionary paramRequest = new Dictionary();
paramRequest.add("count","1");
 
List refund = client.Payment.Fetch(paymentId).AllRefunds(paramRequest)

```bash: CLI
razorpay refunds payment-refunds pay_ABC123 --count 10 --skip 0
```

### Response

```json: Success
{
  "entity": "collection",
  "count": 2,
  "items": [
    {
      "id": "rfnd_FP8DDKxqJif6ca",
      "entity": "refund",
      "amount": 300100,
      "currency": "INR",
      "payment_id": "pay_29QQoUBi66xm2f",
      "notes": {
        "comment": "Comment for refund"
      },
      "receipt": null,
      "acquirer_data": {
        "arn": "10000000000000"
      },
      "created_at": 1597078124,
      "batch_id": null,
      "status": "processed",
      "speed_processed": "normal",
      "speed_requested": "optimum"
    },
    {
      "id": "rfnd_FP8DRfu3ygfOaC",
      "entity": "refund",
      "amount": 200000,
      "currency": "INR",
      "payment_id": "pay_29QQoUBi66xm2f",
      "notes": {
        "comment": "Comment for refund"
      },
      "receipt": null,
      "acquirer_data": {
        "arn": "10000000000000"
      },
      "created_at": 1597078137,
      "batch_id": null,
      "status": "processed",
      "speed_processed": "normal",
      "speed_requested": "optimum"
    }
  ]
}

```json: Failure
{
    "error": {
        "code": "BAD_REQUEST_ERROR",
        "description": "The id provided does not exist",
        "source": "business",
        "step": "payment_initiation",
        "reason": "input_validation_failed",
        "metadata": {}
    }
}
```

### Parameters

`id` _mandatory_
: `string` Unique identifier of the payment for which refund has been requested.

### Parameters

`from` _optional_
: `integer` Unix timestamp at which the refunds were created.

`to` _optional_
: `integer` Unix timestamp till which the refunds were created.

`count` _optional_
:  `integer` The number of refunds to fetch for the payment.

`skip` _optional_
: `integer` The number of refunds to be skipped for the payment.

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). 
 For example, if the refund value is 30, it will be `3000`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty”`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `array` A dynamic array consisting of a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

The API \{key/secret\} provided is invalid.
* code: 4xx
* description: The API credentials passed in the API call differ from the ones generated on the Dashboard.
* solution: The API keys must be active and entered correctly with no whitespace before or after.

The requested URL was not found on the server.
* code: 400
* description: Possible reasons: - The URL is wrong or is missing something.
- A POST API is executed by GET method.

* solution: - Ensure that the URL is correct and complete.
- Use the correct method, that is, POST.

_id is not a valid id
* code: 400
* description: The `payment_id` entered is invalid or incomplete.
* solution: Use a valid `payment_id`.

The id provided does not exist
* code: 400
* description: The `payment_id` is not entered.
* solution: Use a valid `payment_id`.

count must be an integer between 1 and 100.
* code: 400
* description: An invalid value was passed for the `count` query parameter. The API returns variants of this error depending on the input: `The count must be at least 1.` (for `count=0`), `The count must be no greater than 100.` (for values above 100), `The count must be no less than 1.` (for negative values) or `The count must be an integer.` (for non-integer values like `count=abc`).
* solution: Pass `count` as a positive integer between 1 and 100.

skip must be a non-negative integer.
* code: 400
* description: An invalid value was passed for the `skip` query parameter. The API returns `The skip must be no less than 0.` for negative values, or `The skip must be an integer.` for non-integer values.
* solution: Pass `skip` as a non-negative integer (0 or higher).

from and to must be UNIX-epoch integers.
* code: 400
* description: A non-integer value (for example a human-readable date like `2024-01-01`) was passed for `from` or `to`. The API returns `The from must be an integer.` or `The to must be an integer.` respectively. Negative values produce `The from must be no less than 0.`
* solution: Pass `from` and `to` as non-negative UNIX-epoch integers (seconds), not as human-readable dates.


---
title: Fetch a Specific Refund for a Payment
description: Fetch a Specific Refund for a Payment using Razorpay Refunds API.
---

# Fetch a Specific Refund for a Payment

**GET** `/v1/payments/:payment_id/refunds/:refund_id`

Use this endpoint to retrieve details of a specific refund made for a payment.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X GET https://api.razorpay.com/v1/payments/pay_29QQoUBi66xm2f/refunds/rfnd_AABBdHIieexn5c

```java: Java
RazorpayClient razorpay = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

String paymentId = "pay_29QQoUBi66xm2f";

String refundId = "rfnd_AABBdHIieexn5c";

Payment payment = razorpay.payments.fetchRefund(paymentId,refundId);

```php: PHP
$api = new Api($key_id, $secret);

$api->payment->fetch($paymentId)->fetchRefund($refundId);

```python: Python
import razorpay
client = razorpay.Client(auth=("YOUR_ID", "YOUR_SECRET"))

client.payment.fetch_refund_id(paymentId,refundId)

```go: Go
import ( razorpay "github.com/razorpay/razorpay-go" )
client := razorpay.NewClient("YOUR_KEY_ID", "YOUR_SECRET")

body, err := client.Payment.FetchRefund("","", nil, nil)

```ruby: Ruby
require "razorpay"
Razorpay.setup('YOUR_KEY_ID', 'YOUR_SECRET')

paymentId = "pay_29QQoUBi66xm2f"

refundId = "rfnd_AABBdHIieexn5c"

Razorpay::Payment.fetch(paymentId).fetch_refund(refundId)

```javascript: Node.js
var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

instance.payments.fetchRefund('pay_JTVtDcN1uRYb5n','rfnd_JTvPLzbhq92ZWD')
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  }
})
```csharp: .NET
RazorpayClient client = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");
Payment payment = client.Payment.Fetch(paymentId);

Refund refund = payment.Refunds.Fetch(refundId);

}

```csharp: .NET
//initialize the SDK client
RazorpayClient client = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

string paymentId = "pay_Z6t7VFTb9xHeOs";

string refundId = "rfnd_Z6t7VFTb9xHeOs";

Refund refund = client.Payment.Fetch(paymentId).FetchRefund(refundId);

```bash: CLI
razorpay refunds payment-refund pay_ABC123 rfnd_ABC123
```

### Response

```json: Success
{
  "id": "rfnd_AABBdHIieexn5c",
  "entity": "refund",
  "amount": 300100,
  "currency": "INR",
  "payment_id": "pay_FIKOnlyii5QGNx",
  "notes": {
    "comment": "Comment for refund"
  },
  "receipt": null,
  "acquirer_data": {
    "arn": "10000000000000"
  },
  "created_at": 1597078124,
  "batch_id": null,
  "status": "processed",
  "speed_processed": "normal",
  "speed_requested": "optimum"
}

```json: Failure
{
  "error": {
      "code": "BAD_REQUEST_ERROR",
      "description": "AABBdHIieex is not a valid id",
      "source": "business",
      "step": "payment_initiation",
      "reason": "input_validation_failed",
      "metadata": {}
  }
}
```

### Parameters

`payment_id` _mandatory_
: `string` Unique identifier of the payment for which the refund has been made.

`refund_id` _mandatory_
: `string` Unique identifier of the refund to be retrieved.

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). 
 For example, if the refund value is 30, it will be `3000`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty”`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `object` An object containing a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

The API \{key/secret\} provided is invalid.
* code: 4xx
* description: The API credentials passed in the API call differ from the ones generated on the Dashboard.
* solution: The API keys must be active and entered correctly with no whitespace before or after.

The requested URL was not found on the server.
* code: 400
* description: Possible reasons: - The URL is wrong or is missing something.
- A GET API is executed by POST method.
 
* solution: - Ensure that the URL is correct and complete.
- Use the correct method, that is, GET.

_id is not a valid id
* code: 400
* description: - The refund or payment id entered is invalid or incomplete.
- There is an extra space in the URL.

* solution: Use valid refund and payment ids without any spaces.

The id provided does not exist
* code: 400
* description: The refund id entered is incomplete or invalid.
* solution: Use a complete and valid refund id.

invalid request sent
* code: 400
* description: The `payment_id` and `refund_id` combination does not match. Either the refund does not belong to the specified payment or one of the ids is for a non-existent record.
* solution: Pass a matching `payment_id` / `refund_id` pair. Both must exist and the refund must belong to the payment.


---
title: Fetch All Refunds
description: Fetch all Refunds using Razorpay Refunds API.
---

# Fetch All Refunds

**GET** `/v1/refunds/`

Use this endpoint to retrieve details of all refunds. However, by default, only the last 10 refunds are returned. You can use count and skip query parameters to change that behaviour.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X GET https://api.razorpay.com/v1/refunds

```java: Java
RazorpayClient razorpay = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

JSONObject params = new JSONObject();
params.put("count","1");
        
List refund = razorpay.refunds.fetchAll(params);

```php: PHP
$api = new Api($key_id, $secret);

$api->refund->all($options);

```python: Python
import razorpay
client = razorpay.Client(auth=("YOUR_ID", "YOUR_SECRET"))

client.refund.all(options)

```go: Go
import ( razorpay "github.com/razorpay/razorpay-go" )
client := razorpay.NewClient("YOUR_KEY_ID", "YOUR_SECRET")

option := map[string]interface{}{
    "count" : 2
}
body, err := client.Payment.All(option, nil)

```javascript: Node.js
var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

instance.refunds.all(options)

```ruby: Ruby
require "razorpay"
Razorpay.setup('YOUR_KEY_ID', 'YOUR_SECRET')

options = {"count":1}

Razorpay::Refund.all(options)

```csharp: .NET
//initialize the SDK client
RazorpayClient client = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

Dictionary paramRequest = new Dictionary();
paramRequest.Add("count", "1");

List refund = client.Refund.All(paramRequest);

```bash: CLI
razorpay refunds list --count 10 --skip 0 --from 1776754530 --to 1776758130
```

### Response

```json: Success
{
  "entity": "collection",
  "count": 2,
  "items": [
    {
      "id": "rfnd_FFX6AnnIN3puqW",
      "entity": "refund",
      "amount": 88800,
      "currency": "INR",
      "payment_id": "pay_FFX5FdEYx8jPwA",
      "notes": {
        "comment": "Issuing an instant refund"
      },
      "receipt": null,
      "acquirer_data": {},
      "created_at": 1594982363,
      "batch_id": null,
      "status": "processed",
      "speed_processed": "optimum",
      "speed_requested": "optimum"
    },
    {
      "id": "rfnd_EqWThTE7dd7utf",
      "entity": "refund",
      "amount": 6000,
      "currency": "INR",
      "payment_id": "pay_EpkFDYRirena0f",
      "notes": {
        "comment": "Issuing a normal refund"
      },
      "receipt": null,
      "acquirer_data": {
        "arn": "10000000000000"
      },
      "created_at": 1589521675,
      "batch_id": null,
      "status": "processed",
      "speed_processed": "normal",
      "speed_requested": "normal"
    }
  ]
}
```json: Failure
{
    "error": {
        "code": "BAD_REQUEST_ERROR",
        "description": "The payment id field is required.",
        "source": "business",
        "step": "payment_initiation",
        "reason": "input_validation_failed",
        "metadata": {},
        "field": "payment_id"
    }
}
```

### Parameters

`from` _optional_
: `integer` Unix timestamp at which the refunds were created.

`to` _optional_
: `integer` Unix timestamp till which the refunds were created.

`count` _optional_
: `integer` The number of refunds to fetch. You can fetch a maximum of 100 refunds.

`skip` _optional_
: `integer` The number of refunds to be skipped.

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). For example, if the refund value is 30, it will be `3000`.

`currency`
: `string` The currency of a payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty”`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `object` An object containing a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

The API \{key/secret\} provided is invalid.
* code: 4xx
* description: The API credentials passed in the API call differ from the ones generated on the Dashboard.
* solution: The API keys must be active and entered correctly with no whitespace before or after.

The requested URL was not found on the server.
* code: 400
* description: The URL is wrong or is missing something.
* solution: Ensure that the URL is correct and complete.

The payment id field is required.
* code: 400
* description: A GET API is executed by POST method.
* solution: Use the correct method, that is, GET.

count must be an integer between 1 and 100.
* code: 400
* description: An invalid value was passed for the `count` query parameter. The API returns variants of this error depending on the input: `The count must be at least 1.` (for `count=0`), `The count must be no greater than 100.` (for values above 100), `The count must be no less than 1.` (for negative values) or `The count must be an integer.` (for non-integer values like `count=abc`).
* solution: Pass `count` as a positive integer between 1 and 100. For larger datasets, paginate using `skip`.

skip must be a non-negative integer.
* code: 400
* description: An invalid value was passed for the `skip` query parameter. The API returns `The skip must be no less than 0.` for negative values, or `The skip must be an integer.` for non-integer values.
* solution: Pass `skip` as a non-negative integer (0 or higher).

from and to must be UNIX-epoch integers.
* code: 400
* description: A non-integer value (for example a human-readable date like `2024-01-01`) was passed for `from` or `to`. The API returns `The from must be an integer.` or `The to must be an integer.` respectively.
* solution: Pass `from` and `to` as UNIX-epoch integers (seconds), not as human-readable dates.


---
title: Fetch Refund With ID
description: Fetch Refund With id using Razorpay Refunds API.
---

# Fetch Refund With ID

**GET** `/v1/refunds/:id`

Use this endpoint to retrieve the refund using the id.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \

-X GET https://api.razorpay.com/v1/refunds/rfnd_DfjjhJC6eDvUAi

```java: Java
RazorpayClient razorpay = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

String refundId = "rfnd_DfjjhJC6eDvUAi";

List refund = razorpay.refunds.fetch(refundId);

```php: PHP
$api = new Api($key_id, $secret);

$api->refund->fetch($refundId);

```python: Python
import razorpay
client = razorpay.Client(auth=("YOUR_ID", "YOUR_SECRET"))

client.refund.fetch(refundId)

```ruby: Ruby
require "razorpay"
Razorpay.setup('YOUR_KEY_ID', 'YOUR_SECRET')

refundId = "rfnd_DfjjhJC6eDvUAi"

Razorpay::Refund.fetch(refundId)

```go: Go
import ( razorpay "github.com/razorpay/razorpay-go" )
client := razorpay.NewClient("YOUR_KEY_ID", "YOUR_SECRET")

body, err := client.Refund.Fetch("", nil, nil)

```javascript: Node.js
var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

instance.refunds.fetch(refundId)

```csharp: .NET
//initialize the SDK client
RazorpayClient client = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

string refundId = "rfnd_Z6t7VFTb9xHeOs";

Refund refund = client.Refund.Fetch(refundId);

```bash: CLI
razorpay refunds fetch rfnd_ABC123
```

### Response

```json: Success
{
  "id": "rfnd_DfjjhJC6eDvUAi",
  "entity": "refund",
  "amount": 6000,
  "currency": "INR",
  "payment_id": "pay_EpkFDYRirena0f",
  "notes": {
    "comment": "Issuing an instant refund"
  },
  "receipt": null,
  "acquirer_data": {
    "arn": "10000000000000"
  },
  "created_at": 1589521675,
  "batch_id": null,
  "status": "processed",
  "speed_processed": "optimum",
  "speed_requested": "optimum"
}

```json: Failure
{
    "error": {
        "code": "BAD_REQUEST_ERROR",
        "description": "The requested URL was not found on the server.",
        "source": "NA",
        "step": "NA",
        "reason": "NA",
        "metadata": {}
    }
}
```

### Parameters

`id` _mandatory_
: `string` Unique identifier of the refund which is to be retrieved.

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). 
 For example, if the refund value is 30, it will be `3000`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty”`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `object` An object containing a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

The API \{key/secret\} provided is invalid.
* code: 4xx
* description: The API credentials passed in the API call differ from the ones generated on the Dashboard.
* solution: The API keys must be active and entered correctly with no whitespace before or after.

The requested URL was not found on the server.
* code: 400
* description: Possible reasons: - The URL is wrong or is missing something.
- A GET API is executed by POST method.
 
* solution: - Ensure that the URL is correct and complete.
- Use the correct method, that is, GET.

_id is not a valid id
* code: 400
* description: The refund id entered is invalid.
* solution: Use a valid refund id.

The id provided does not exist
* code: 400
* description: The refund id entered is incomplete or invalid.
* solution: Use a complete and valid refund id.


---
title: Update a Refund
description: Update a Refund using Razorpay Refunds API.
---

# Update a Refund

**PATCH** `/v1/refunds/:id/`

Use this endpoint to update the `notes` parameter for a refund. You can modify an existing refund to update the `notes` field **only**.
- Notes can be used to record additional information about the payment.
- You can add up to 15 key-value pairs with each value of the key not exceeding 256 characters.

### Request

```curl: Curl
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X PATCH https://api.razorpay.com/v1/refunds/rfnd_DfjjhJC6eDvUAi \
-H 'Content-Type: application/json' \
-d '{
    "notes": {
      "notes_key_1":"Beam me up Scotty.",
      "notes_key_2":"Engage"
    }
}'

```java: Java
RazorpayClient razorpay = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

String refundId = "rfnd_DfjjhJC6eDvUAi";

JSONObject refundRequest = new JSONObject();
JSONObject notes = new JSONObject();
notes.put("notes_key_1","Tea, Earl Grey, Hot");
notes.put("notes_key_2","Tea, Earl Grey… decaf.");
refundRequest.put("notes",notes);

Refund refund = razorpay.refunds.edit(refundId,refundRequest);

```php: PHP
$api = new Api($key_id, $secret);

$api->refund->fetch($refundId)->edit(array('notes'=> array('notes_key_1'=>'Beam me up Scotty.', 'notes_key_2'=>'Engage')));

```python: Python
import razorpay
client = razorpay.Client(auth=("YOUR_ID", "YOUR_SECRET"))

client.refund.edit(refundId,{
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  }
})

```go: Go
import ( razorpay "github.com/razorpay/razorpay-go" )
client := razorpay.NewClient("YOUR_KEY_ID", "YOUR_SECRET")

data:= map[string]interface{}{
  "notes": map[string]interface{}{
    "notes_key_1":"Beam me up Scotty.",
    "notes_key_2":"Engage",
  },
}

body, err := client.Refund.Update("", data, nil)

```javascript: Node.js
var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

instance.refunds.edit(refundId,{
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  }
}) 

```ruby: Ruby
require "razorpay"
Razorpay.setup('YOUR_KEY_ID', 'YOUR_SECRET')

refundId = "rfnd_DfjjhJC6eDvUAi"

para_attr = {
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  }
}

Razorpay::Refund.fetch(refundId).edit(para_attr)

```csharp: .NET
//initialize the SDK client
RazorpayClient client = new RazorpayClient("[YOUR_KEY_ID]", "[YOUR_KEY_SECRET]");

string refundId = "rfnd_Z6t7VFTb9xHeOs";

Dictionary refundRequest = new Dictionary();
Dictionary notes = new Dictionary();
notes.Add("notes_key_1", "Tea, Earl Grey, Hot update");
notes.Add("notes_key_2", "Tea, Earl Grey… decaf.");
refundRequest.Add("notes", notes);

Refund refund = client.Refund.Fetch(refundId).Edit(refundRequest);

```bash: CLI
razorpay refunds update rfnd_ABC123 --note key1="Updated note" --note key2="Another note"
```

### Response

```json: Success
{
  "id": "`rfnd_DfjjhJC6eDvUAi`",
  "entity": "refund",
  "amount": 300100,
  "currency": "INR",
  "payment_id": "pay_FIKOnlyii5QGNx",
  "notes": {
    "notes_key_1": "Beam me up Scotty.",
    "notes_key_2": "Engage"
  },
  "receipt": null,
  "acquirer_data": {
    "arn": "10000000000000"
  },
  "created_at": 1597078124,
  "batch_id": null,
  "status": "processed",
  "speed_processed": "normal",
  "speed_requested": "optimum"
}

```json: Failure
{
  "error": {
      "code": "BAD_REQUEST_ERROR",
      "description": "{rfnd_id} is not a valid id",
      "source": "business",
      "step": "payment_initiation",
      "reason": "input_validation_failed",
      "metadata": {}
  }
}
```

### Parameters

`id` _mandatory_
: `string` Unique identifier of the refund for which the `notes` field should be updated.

### Parameters

`notes` _mandatory_
: `json object` Additional information to be modified or added as part of `notes` field in key-pair format. Know more about [notes](https://razorpay.com/docs/build/llm-docs/api/understand.md#notes).

### Parameters

`id`
: `string` The unique identifier of the refund. For example, `rfnd_FgRAHdNOM4ZVbO`.

`entity`
: `string` Indicates the type of entity. Here, it is `refund`.

`amount`
: `integer` The amount to be refunded (in the smallest unit of currency). 
 For example, if the refund value is 30, it will be `3000`.

`currency`
: `string` The currency of payment amount for which the refund is initiated. Check the list of [supported currencies](https://razorpay.com/docs/build/llm-docs/payments/international-payments.md#supported-currencies).

`payment_id`
: `string` The unique identifier of the payment for which a refund is initiated. For example, `pay_FgR9UMzgmKDJRi`.

`created_at`
: `integer` Unix timestamp at which the refund was created. For example, `1600856650`.

`batch_id`
: `string` This parameter is populated if the refund was created as part of a batch upload. For example, `batch_00000000000001`.

`notes`
: `json object` Key-value store for storing your reference data. A maximum of 15 key-value pairs can be included. For example, `"note_key": "Beam me up Scotty”`.

`receipt`
: `string` A unique identifier provided by you for your internal reference.

`acquirer_data`
: `object` An object containing a unique reference number (either RRN, ARN or UTR) that is provided by the banking partner when a refund is processed. This reference number can be used by the customer to track the status of the refund with the bank.

`status`
: `string` Indicates the state of the refund. Possible values:
  - `pending`: This state indicates that Razorpay is attempting to process the refund.
  - `processed`: This is the final state of the refund.
  - `failed`: A refund can attain the failed state in the following scenarios:

     - Normal refund is not possible for a payment which is more than 6 months old.

     - Instant Refund can sometimes fail because of customer's account or bank-related issues.

`speed_requested`
: `string` The processing mode of the refund seen in the refund response. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request.
Possible values:
  - `normal`: Indicates that the refund will be processed via the normal speed. The refund will take 5-7 working days.
  - `optimum`: Indicates that the refund will be processed at an optimal speed based on Razorpay's internal fund transfer logic.
     - If the refund can be processed instantly, Razorpay will do so, irrespective of the payment method used to make the payment.
     - If an instant refund is not possible, Razorpay will initiate a refund that is processed at the normal speed.

`speed_processed`
: `string` This is a parameter in the response which describes the mode used to process a refund. 
 This attribute is seen in the refund response only if the `speed` parameter is set in the refund request. Possible values:
  - `instant`: Indicates that the refund has been processed instantly via fund transfer.
  - `normal`: Indicates that the refund has been processed by the payment processing partner. The refund will take 5-7 working days.

### Errors

The API \{key/secret\} provided is invalid.
* code: 4xx
* description: The API credentials passed in the API call differ from the ones generated on the Dashboard.
* solution: The API keys must be active and entered correctly with no whitespace before or after.

The requested URL was not found on the server.
* code: 400
* description: Possible reasons: - A PATCH API is executed by POST method.
- The URL is wrong or is missing something.
- The refund id is not entered.

* solution: - Use the correct method, that is, PATCH.
- Ensure that the URL is correct and complete.
- Use a valid refund id.

\{rfnd_id\} is not a valid id
* code: 400
* description: The refund id entered is invalid or incomplete.
* solution: Use a valid and complete refund id.

The notes field is required
* code: 400
* description: The request body does not include the `notes` parameter.
* solution: Ensure you enter the `notes` parameter in the request body.


