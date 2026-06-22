-- Custom SQL migration file, put your code below! --
ALTER TABLE "user_subscriptions" RENAME COLUMN "razorpay_subscription_id" TO "provider_subscription_id";
ALTER TABLE "user_subscriptions" RENAME COLUMN "razorpay_customer_id" TO "provider_customer_id";
ALTER TABLE "user_subscriptions" RENAME COLUMN "payment_method" TO "payment_gateway_provider";