drop view v_sheet_name;

create view v_sheet_name as
select
    file_name,
    file_name_org,
    file_key,
    sheet_idx,
    sheet_name_org,
    data_name
from
    data_a
group by
    file_name,
    file_name_org,
    file_key,
    sheet_idx,
    sheet_name_org,
    data_name
;


