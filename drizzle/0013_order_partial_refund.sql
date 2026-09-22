-- 部分返金の記録。
--
-- これまで返金は「全額か、無いか」しか表現できず、Stripe ダッシュボードから
-- 一部だけ返金すると Webhook は ops 通知を出すだけで DB に残らなかった。
-- 実額を持たせることで、一部返金を注文に反映できるようにする。
--
-- NULL = 返金なし。`status = 'refunded'` は全額返金のときだけ付く
-- （部分返金は注文の進行を止めないので、発送は続く）。
ALTER TABLE `orders` ADD `refunded_amount` integer;
