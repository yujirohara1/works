drop table data_a cascade;

create table data_a (
    file_key varchar(1000),
    file_name_org varchar(1000),
    file_name varchar(1000),
    sheet_idx integer,
    sheet_name_org varchar(1000),
    data_name varchar(1000),
    row_id int,
    col_id integer,
    col_key varchar(3),
    value_char varchar(1000),
    value_num int,
    value_date date,
    info varchar(1000),
    is_row_header varchar(1),
    is_col_header varchar(1)
);


-- select * from data_a;

ALTER TABLE data_a DROP CONSTRAINT data_a_prkey;

ALTER TABLE ONLY data_a
    ADD CONSTRAINT data_a_prkey PRIMARY KEY (
       file_key,
       sheet_idx,
       row_id,
       col_id   
    );



-- create index idx1_data_a on data_a (project_id, assigned_to);
-- create index idx2_data_a on data_a (project_id, customer_id);
