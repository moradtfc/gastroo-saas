-- Agrega columna de relación entre suppliers y food_categories
alter table suppliers
  add column if not exists food_category_id uuid
    references food_categories(id)
    on delete set null;

create index if not exists idx_suppliers_food_category_id
  on suppliers(food_category_id);

-- Intenta enlazar registros existentes usando el nombre almacenado
update suppliers s
set food_category_id = fc.id
from food_categories fc
where s.category is not null
  and s.food_category_id is null
  and lower(fc.name) = lower(s.category);

