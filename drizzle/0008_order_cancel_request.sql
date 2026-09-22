-- お客様からのキャンセル依頼。
-- 返金の実行は従来どおり owner 限定（adminRefundOrderAction）のままとし、
-- ここでは「依頼があった」事実だけを記録して管理画面に出す。
ALTER TABLE `orders` ADD `cancel_requested_at` integer;
--> statement-breakpoint
ALTER TABLE `orders` ADD `cancel_reason` text;
