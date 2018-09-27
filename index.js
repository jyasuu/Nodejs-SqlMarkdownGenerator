var sql = require('mssql');
var fs = require('fs');

var config = {
    user: process.argv[2 + 2],
    password: process.argv[3 + 2],
    server: process.argv[0 + 2],
    database: process.argv[1 + 2],
    driver: 'tedious',
    options: {
        encrypt: true
    }
};
if (!fs.existsSync(process.argv[4 + 2])) {
    fs.mkdirSync(process.argv[4 + 2]);
}

console.log(config);

sql.connect(config, function (err) {
    if (err) console.log(err);

    var request = new sql.Request();
    request.query("    SELECT a.Table_schema +'.'+a.Table_name   as 表格名稱              ,b.COLUMN_NAME                     as 欄位名稱              ,b.DATA_TYPE                       as 資料型別              ,isnull(b.CHARACTER_MAXIMUM_LENGTH,'') as 長度              ,isnull(b.COLUMN_DEFAULT,'')           as 預設值              ,b.IS_NULLABLE                         as 是否允許空值             ,c.CONSTRAINT_NAME            ,( SELECT value                FROM fn_listextendedproperty (NULL, 'schema', a.Table_schema, 'table', a.TABLE_NAME, 'column', default)                 WHERE name='MS_Description' and objtype='COLUMN'                  and objname Collate Chinese_Taiwan_Stroke_CI_AS = b.COLUMN_NAME               ) as 欄位描述       FROM INFORMATION_SCHEMA.TABLES  a        LEFT JOIN INFORMATION_SCHEMA.COLUMNS b ON a.TABLE_NAME = b.TABLE_NAME        LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE c ON b.TABLE_NAME = c.TABLE_NAME  AND b.COLUMN_NAME =c.COLUMN_NAME    WHERE TABLE_TYPE='BASE TABLE'    ORDER BY a.TABLE_NAME , b.ORDINAL_POSITION",
        function (err, recordset) {
            if (err) console.log(err);

            var groups = groupBy(recordset.recordsets[0], a => a["表格名稱"]);

            var readmeFileContent='';
            readmeFileContent += '#   All Tables';
            readmeFileContent += '\n';
            readmeFileContent += '\n';
            groups.forEach(group => {
                var fileContent = '#   ' + group.key;
                readmeFileContent+='-   ['+group.key+'}]('+group.key+'.md)';
                readmeFileContent += '\n';
                fileContent += '\n';
                fileContent += '\n';
                fileContent += '| 欄位名稱 | 主鍵名稱 | 資料型別 | 長度 | 預設值 | 是否允許空值 | 欄位描述 |';
                fileContent += '\n';
                fileContent += '| -------- | -------- | ---- | ------ | ------------ | -------- | -------- |';
                fileContent += '\n';
                group.datas.forEach(
                    data => {
                        var row = [
                            data['欄位名稱'] ? data['欄位名稱'] : '--',
                            data['CONSTRAINT_NAME'] ? data['CONSTRAINT_NAME'] : '--',
                            data['資料型別'] ? data['資料型別'] : '--',
                            data['長度'] ? data['長度'] : '--',
                            data['預設值'] ? data['預設值'] : '--',
                            data['是否允許空值'] ? data['是否允許空值'] : '--',
                            data['欄位描述'] ? data['欄位描述'] : '--',
                        ];
                        fileContent += '| ' + row.join(' | ') + ' |'  ;
                        fileContent += '\n';

                    }
                );
                function writeFileCallBack(err){if(err)console.log(err);};
                fs.writeFile(process.argv[4 + 2] + '\\' + group.key+'.md', fileContent,writeFileCallBack);
            });
            function writeFileCallBack(err){if(err)console.log(err);};
            fs.writeFile(process.argv[4 + 2] + '\\README.md', readmeFileContent,writeFileCallBack);

            
        });

});

function groupBy(datas, keySelector) {
    var groups = [];
    datas.forEach(data => {
        var key = keySelector(data);
        var existGroup = groups.find(group => group.key === key);
        if (existGroup) {
            existGroup.datas.push(data);
        } else {
            var addGroup = {
                key: key,
                datas: [data]
            };
            groups.push(addGroup);
        }

    });
    return groups;

}
