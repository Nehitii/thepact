ALTER TABLE wishlist_items ADD COLUMN priority text NOT NULL DEFAULT 'low';
ALTER TABLE wishlist_items ADD COLUMN sort_order integer NOT NULL DEFAULT 0;