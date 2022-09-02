drop view v_file_name;

create view v_file_name as
select
    file_name,
    file_name_org,
    file_key
from
    data_a
group by
    file_name,
    file_name_org,
    file_key
;


