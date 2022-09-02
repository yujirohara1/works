window.onload = function(){

  createFileNameTable();
  
  document.getElementById("btnFileImport").classList.add("disabled");
}






//ファイル取り込みボタンクリック
document.getElementById("btnFileImport").addEventListener('click', function() {
  var files = document.querySelector('#inpFileImport').files
  let formData = new FormData();
  formData.append('excelFile', files[0]);

  fetch('/uploadFiles', {
    method: 'PUT',
    body: formData,
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    document.getElementById("msgFileImportDescribe").innerText = list.length + "シートで構成されるExcelファイルを検出しました。";
    destroyTableLoading("divFileImportTableArea");
    var hdText = ["シート名", "列数", "行数", "収集", "状態"];
    var hdColWidth = ["45%","10%","10%","15%","20%"];
    var tableId = initTable("divFileImportTableArea", hdText, hdColWidth,5);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      var td3 = document.createElement('td');
      var td4 = document.createElement('td');
      var td5 = document.createElement('td');
      td1.innerText = list[i].sheetName; // "a"; //list[i].user_name=="" ? list[i].assigned_to:list[i].user_name;
      td2.innerText = list[i].colSize; // "a"; //list[i].user_name=="" ? list[i].assigned_to:list[i].user_name;
      td3.innerText = list[i].rowSize; // "a"; //list[i].user_name=="" ? list[i].assigned_to:list[i].user_name;
      td5.innerText = "";
      td5.id = "tdImportStatus_" + i;
      td4.appendChild(buttonHtmlCollectData(list[i].fileName, list[i].fileNameOrg, list[i].sheetIdx, list[i].sheetName, list[i].rowSize, td5.id));
      td1.classList.add("tdcell-left");
      td2.classList.add("tdcell-center");
      td3.classList.add("tdcell-center");
      td4.classList.add("tdcell-center");
      td5.classList.add("tdcell-left");
      trow.appendChild(td1);
      trow.appendChild(td2);
      trow.appendChild(td3);
      trow.appendChild(td4);
      trow.appendChild(td5);
      tbody.appendChild(trow);
    }

    //document.querySelector('#lblFileProperty').innerHTML = "取り込み完了！"; //jsonData.data;
    //document.getElementById('btnFileImport').classList.remove("disabled");
  })
  .catch(error => { console.log(error); });

  createTableLoading("divFileImportTableArea","ファイルを解析しています・・・")

  document.getElementById('btnFileImport').classList.add("disabled");

});




let targets = document.querySelectorAll("[id^='dashboard-tab']"); //' #divGraphArea *');
targets.forEach(target => {
  target.addEventListener("shown.bs.tab", function (event) {
    if(event.target.id == "dashboard-DataManage-tab"){
      createFileNameTable();
    } else if(event.target.id == "dashboard-DataCreate-tab"){
      createDataLabelTable();
    }
  });
});

/*
|| 
*/
function createDataLabelTable(){
  //var projectId = document.getElementById("selectProjectSetting").value;
  createTableLoading("divDataLabelTableArea","データラベルテーブルを作成中・・・")

  fetch('/getDataLabelList' , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divDataLabelTableArea");

    var hdText = ["データラベル", "出現回数"];
    var hdColWidth = ["70%","30%"];
    var tableId = initTable("divDataLabelTableArea", hdText, hdColWidth,3.5);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      trow.addEventListener('click', function() {
        //alert(1);
        tRowSetColor(event.target,tableId);
        createSampleValueTable(list[i].value_char);
        //createDataPreviewTable(list[i].file_key,0);
      });
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      td1.innerText = list[i].value_char;
      td2.innerText = list[i].data_count;
      td1.classList.add("tdcell-left");
      td2.classList.add("tdcell-center");
      trow.appendChild(td1);
      trow.appendChild(td2);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    //openErrorMessageDialog(error);
    console.log(error)
  });
}
  
/*
|| 
*/
function createDataSetTable(rowId, colId, dataLabel){
  createTableLoading("divDataSetTableArea","データセットを作成中")

  fetch('/getDataSetList/' + rowId + "/" + colId , {
  //fetch('/getSampleValueList' , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divDataSetTableArea");

    var hdText = ["データ名","データラベル", "値"];
    var hdColWidth = ["35%","30%","35%"];
    var tableId = initTable("divDataSetTableArea", hdText, hdColWidth,3.5);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      trow.addEventListener('click', function() {
        //alert(1);
        tRowSetColor(event.target,tableId);
        // createSheetNameTable(list[i].file_key);
        // createDataPreviewTable(list[i].file_key,0);
      });
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      var td3 = document.createElement('td');
      td1.innerText = list[i].data_name;
      td2.innerText = dataLabel; //list[i].value_char;
      td3.innerText = list[i].value_char;
      td1.classList.add("tdcell-left");
      td2.classList.add("tdcell-left");
      td3.classList.add("tdcell-right");
      trow.appendChild(td1);
      trow.appendChild(td2);
      trow.appendChild(td3);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    //openErrorMessageDialog(error);
    console.log(error)
  });
}

/*
|| 
*/
function createSampleValueTable(sampleValue){
  createTableLoading("divSampleValueTableArea","値のサンプルデータを抽出中")

  fetch('/getSampleValueList/' + sampleValue , {
  //fetch('/getSampleValueList' , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divSampleValueTableArea");

    var hdText = ["ファイル名", "データ名", "値サンプル","行番号","列番号"];
    var hdColWidth = ["30%","30%","30%","5%","5%"];
    var tableId = initTable("divSampleValueTableArea", hdText, hdColWidth,3.5);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      trow.addEventListener('click', function() {
        //alert(1);
        tRowSetColor(event.target,tableId);
        createDataSetTable(list[i].row_id,list[i].col_id,sampleValue);
        // createDataPreviewTable(list[i].file_key,0);
      });
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      var td3 = document.createElement('td');
      var td4 = document.createElement('td');
      var td5 = document.createElement('td');
      td1.innerText = list[i].file_name_org;
      td2.innerText = list[i].data_name;
      td3.innerText = list[i].value_char;
      td4.innerText = list[i].row_id;
      td5.innerText = list[i].col_id;
      td1.classList.add("tdcell-left");
      td2.classList.add("tdcell-left");
      td3.classList.add("tdcell-left");
      td4.classList.add("tdcell-center");
      td5.classList.add("tdcell-center");
      trow.appendChild(td1);
      trow.appendChild(td2);
      trow.appendChild(td3);
      trow.appendChild(td4);
      trow.appendChild(td5);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    //openErrorMessageDialog(error);
    console.log(error)
  });
}


/*
|| 
*/
function createFileNameTable(){
  //var projectId = document.getElementById("selectProjectSetting").value;
  createTableLoading("divFileListTableArea","ファイル名リストを作成中・・・")

  fetch('/getFileNameList' , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divFileListTableArea");

    //document.getElementById("divLabelProcessing2").innerText = jsonData.returnStatus; //list[0].issue_id;

    var hdText = ["ファイル名", "キー"];
    var hdColWidth = ["50%","50%"];
    var tableId = initTable("divFileListTableArea", hdText, hdColWidth,3.5);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      trow.addEventListener('click', function() {
        //alert(1);
        tRowSetColor(event.target,tableId);
        createSheetNameTable(list[i].file_key);
        createDataPreviewTable(list[i].file_key,0);
      });
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      td1.innerText = list[i].file_name;
      td2.innerText = list[i].file_key;
      td1.classList.add("tdcell-left");
      td2.classList.add("tdcell-left");
      trow.appendChild(td1);
      trow.appendChild(td2);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    //openErrorMessageDialog(error);
    console.log(error)
  });
}
  


function createSheetNameTable(fileKey){
  //var projectId = document.getElementById("selectProjectSetting").value;
  createTableLoading("divSheetListTableArea","シート名リストを作成中・・・")
  fetch('/getSheetNameList/' + fileKey , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divSheetListTableArea");

    //document.getElementById("divLabelProcessing2").innerText = jsonData.returnStatus; //list[0].issue_id;

    var hdText = ["#", "シート名", "設定データ名"];
    var hdColWidth = ["10%","40%","50%"];
    var tableId = initTable("divSheetListTableArea", hdText, hdColWidth,3.5);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      trow.addEventListener('click', function() {
        tRowSetColor(event.target,tableId);
        createDataPreviewTable(list[i].file_key, list[i].sheet_idx);
      });
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      var td3 = document.createElement('td');
      td1.innerText = list[i].sheet_idx;
      td2.innerText = list[i].sheet_name_org;
      td3.innerText = list[i].data_name;
      td3.addEventListener('click', function(e) {
        if(e.target.tagName == "TD" && e.target.parentElement.classList.length ==1){
          if(e.target.parentElement.classList[0]=="RowSelected"){
            var val = event.target.innerText;
            event.target.innerText = "";
            event.target.appendChild(inputHtml(val, event.target, list[i].file_key, list[i].sheet_idx));
            inpDataName.focus();
          }
        }
      });
      td1.classList.add("tdcell-center");
      td2.classList.add("tdcell-left");
      td3.classList.add("tdcell-left");
      trow.appendChild(td1);
      trow.appendChild(td2);
      trow.appendChild(td3);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    //openErrorMessageDialog(error);
    console.log(error)
  });
}
  

//左クリックで非表示に変更
document.body.addEventListener('click', function () {
  var menu = document.getElementById("rightClickMenu");
  if (menu.classList.contains('show')) {
    //非表示に戻す
    menu.classList.remove('show');
  }

  let elements = document.body.getElementsByTagName("td");
  Array.prototype.forEach.call(elements, function (element) {
    element.classList.remove("rightClickCellSelected");
  });

});

function createDataPreviewTable(fileKey, sheetIdx){
  createTableLoading("divDataPreviewTableArea","データプレビューを作成中・・・")
  fetch('/getSheetData/' + fileKey + '/' + sheetIdx , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divDataPreviewTableArea");

    //document.getElementById("divLabelProcessing2").innerText = jsonData.returnStatus; //list[0].issue_id;

    //列数を取得
    var colSize = list.filter(r=> r["row_id"] == list[0].row_id ).map(c => c["col_id"]).length; //Math.max.apply(null,list.filter(r=> r["row_id"] == list[0].row_id ).map(c => c["col_id"]));
    var rowSize = list.filter(r=> r["col_id"] == list[0].col_id ).map(c => c["row_id"]).length; //Math.max.apply(null,list.filter(r=> r["col_id"] == list[0].col_id ).map(c => c["row_id"]));
    var hdText = list.filter(r=> r["row_id"] =="0").map(c => c["col_id"]); //["#", "シート名"];
    var hdColWidth = null; //["10%","90%"];
    var tableId = initTable("divDataPreviewTableArea", hdText, hdColWidth,2);
    var tbody = document.getElementById(tableId+"Body");

    tbody.oncontextmenu = function () { return false; }

    tbody.addEventListener('contextmenu',function(e){
      //tbody.querySelectorAll("td").classList.remove("rightClickCellSelected");
      let elements = tbody.getElementsByTagName("td");
      Array.prototype.forEach.call(elements, function (element) {
        element.classList.remove("rightClickCellSelected");
      });

      if(e.target.tagName == "TD"){
        e.target.classList.add("rightClickCellSelected");
      }
      var menu = document.getElementById("rightClickMenu");
      menu.style.left = e.x + 'px';
      menu.style.top = e.y + 'px';
      menu.classList.add("show");
    });

    for(let r=0; r<rowSize; r++){
      var trow = document.createElement('tr');

      for(let c=1; c<=colSize; c++){
        var td1 = document.createElement('td');
        var tmp = list.filter(row=> row["row_id"] ==r).filter(row=> row["col_id"] ==c);
        if(tmp.length ==1){
          td1.innerText = tmp[0].value_char;
          td1.style.fontSize = "9pt";
          if(tmp[0].is_row_header=="Y" || tmp[0].is_col_header=="Y"){
            td1.classList.add("row_header");
          }
        }
        trow.appendChild(td1);
      }
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    //openErrorMessageDialog(error);
    console.log(error)
  });
}

function tRowSetColor(eventObject, tableId){
  var table = document.getElementById(tableId);
  
  // for(let i=0; i<table.rows.length; i++){
  //   table.rows[i].style.backgroundColor = "";
  // }
  let elements = table.getElementsByTagName("tr");
  Array.prototype.forEach.call(elements, function (element) {
    element.classList.remove("RowSelected");
  });

  var trow = eventObject;
  if(trow.tagName == "TD"){
    trow = trow.parentElement;
  }
  if(trow.tagName == "TR"){
    //trow.style.backgroundColor = "#00d4ff99";
    trow.classList.add("RowSelected");
  }
}

//取り込みファイルを指定
document.getElementById("inpFileImport").addEventListener('change', function() {

  var filepath = document.getElementById("inpFileImport").value;
  var tmp = filepath.split(".");
  var extention = tmp[tmp.length-1].toLowerCase();

  document.getElementById("btnFileImport").classList.add("disabled");
  if(extention=="xls" || extention=="xlsx" || extention=="csv"){
    document.getElementById("btnFileImport").classList.remove("disabled");
    document.getElementById("msgFileImport").innerText = "";
  } else {
    document.getElementById("msgFileImport").innerText = "xls, xlsx, csv のいずれかを指定してください。";
  }
});






//ローダーを削除
function destroyTableLoading(locationId){
  var tmp = document.getElementById(locationId); 
  while(tmp.lastChild){
    tmp.removeChild(tmp.lastChild);
  }
  document.getElementById(locationId).style.height = "";
}




// テーブル内のデータが表示されるまでの間、小さいローダーを枠内に表示
function createTableLoading(locationId, messageLabel){
  var tmp = document.getElementById(locationId);
  if(tmp!=null){
    while(tmp.lastChild){
      tmp.removeChild(tmp.lastChild);
    }
  }
  let tableDiv = document.createElement('div');
  tableDiv.classList.add("loadingDiv");
  document.getElementById(locationId).style.height = "calc(100vh/3)";
  //tableDiv.id = tableDivId;
  let messageDiv = document.createElement('div');
  messageDiv.id = locationId + "Caption";
  messageDiv.innerText = messageLabel
  document.getElementById(locationId).appendChild(messageDiv);
  document.getElementById(locationId).appendChild(tableDiv);
}


/*
|| HTMLTableを作る
*/
function initTable(tableDivId, hdText, hdWidth, heightRatio){
  var tableId = tableDivId.replace("div","htmlTable");
  var table = document.createElement("table");
  table.id = tableId;

  var thead = document.createElement('thead');
  var tbody = document.createElement('tbody');
  tbody.id = tableId + "Body";
  thead.appendChild(createTableHeader(hdText, hdWidth));

  table.appendChild(thead);
  table.appendChild(tbody);

  table.classList.add("table", "table-bordered", "table_sticky", "table-hover", "fs-6");
  table.style.height = "calc(100vh/" + heightRatio + ")";

  var tmp = document.getElementById(tableDivId);
  while(tmp.lastChild){
    tmp.removeChild(tmp.lastChild);
  }

  document.getElementById(tableDivId).appendChild(table);

  return tableId;
}

//テーブルの見出し行を作成する。戻したDOMはtheadにappendされる想定。
function createTableHeader(hdText, width){
  let trow = document.createElement('tr');
  for (let hd in hdText){
    var thA = document.createElement('th');
    thA.innerHTML = hdText[hd];
    thA.style.textAlign = "center";
    thA.style.verticalAlign = "middle";
    thA.setAttribute("nowrap","nowrap");
    if(width!=null){
      try{thA.style.width=width[hd];}catch(e){
        openErrorMessageDialog(e.message);
      }
    }
    trow.appendChild(thA);
  }
  return trow;
}



function setAttributes(dom, str){
  var tmp = str.split("/");
  for (let a in tmp){
    b = tmp[a].split(",");
    dom.setAttribute(b[0], b[1]);
  }
}




document.getElementById("contextMenuPickUpCell").addEventListener('click', function() {
  var array = getUpdateKeys();
  //deleteRowOrColumn(array.fileKey, array.sheetIdx, array.rowIdx, array.collIdx, "R");
  // alert(1);
  var table3 = document.getElementById("htmlTableDataPreviewTableAreaBody");
  table3.querySelector(".rightClickCellSelected").classList.add("pickUpCell");
});

document.getElementById("contextMenuDeleteRow").addEventListener('click', function() {
  var array = getUpdateKeys();
  deleteRowOrColumn(array.fileKey, array.sheetIdx, array.rowIdx, array.collIdx, "R");
});


document.getElementById("contextMenuDeleteCol").addEventListener('click', function() {
  var array = getUpdateKeys();
  deleteRowOrColumn(array.fileKey, array.sheetIdx, array.rowIdx, array.collIdx, "C");
});



document.getElementById("contextMenuUpdateRowheaderY").addEventListener('click', function() {
  var array = getUpdateKeys();
  updateHeaderY(array.fileKey, array.sheetIdx, array.rowIdx, array.collIdx, "R");
  
});


document.getElementById("contextMenuUpdateColheaderY").addEventListener('click', function() {
  var array = getUpdateKeys();
  updateHeaderY(array.fileKey, array.sheetIdx, array.rowIdx, array.collIdx, "C");
  
});


function updateHeaderY(fileKey, sheetIdx, rowIdx, collIdx, direction){
  fetch('/updateHeaderY/' + fileKey + "/" + sheetIdx + "/" + rowIdx + "/" + collIdx + "/" + direction, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    //alert(list[0]);
    createDataPreviewTable(fileKey,sheetIdx);

  })
  .catch(error => { 
    console.log(error)
  });

}


function getUpdateKeys(){
  var table1 = document.getElementById("htmlTableFileListTableAreaBody");
  var table2 = document.getElementById("htmlTableSheetListTableAreaBody");
  var table3 = document.getElementById("htmlTableDataPreviewTableAreaBody");
  var fileKey = table1.querySelector(".RowSelected").cells[1].innerText;
  var sheetIdx = table2.querySelector(".RowSelected").cells[0].innerText;
  var collIdx = table3.querySelector(".rightClickCellSelected").cellIndex+1;
  var rowIdx = table3.querySelector(".rightClickCellSelected").parentElement.rowIndex-1;

  return {
    "fileKey":fileKey,
    "sheetIdx":sheetIdx,
    "collIdx":collIdx,
    "rowIdx":rowIdx
  }
}

function deleteRowOrColumn(fileKey, sheetIdx, rowIdx, collIdx, direction){
  fetch('/deleteRowOrColumn/' + fileKey + "/" + sheetIdx + "/" + rowIdx + "/" + collIdx + "/" + direction, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    //alert(list[0]);
    createDataPreviewTable(fileKey,sheetIdx);

  })
  .catch(error => { 
    console.log(error)
  });

}




function buttonHtmlCollectData(fileName, fileNameOrg, sheetIdx, sheetName, rowSize, statusObjId){
  //%a#btnGetMaxNo.btn.btn-dark.btn-sm(type="button")
  var btn = document.createElement('a');
  btn.classList.add("btn","btn-primary","btn-sm");
  //btn.id = "btnUpdateDutyMemberList_" + dutyDate;
  setAttributes(btn,"type,button/dummy,dummy");
  btn.innerText = "収集開始";
  btn.style.paddingBottom = "1px";
  btn.style.paddingTop = "1px";
  btn.style.fontSize = "11.5px";

  btn.addEventListener('click', function() {
    event.target.classList.add("disabled");
    collectSheetData(fileName, fileNameOrg, sheetIdx, sheetName, rowSize, statusObjId, 0);
    
  });
  return btn;
}

function inputHtml(dataName, parentObj, fileKey, sheetIdx){
  //%a#btnGetMaxNo.btn.btn-dark.btn-sm(type="button")
  var input = document.createElement('input');
  input.classList.add("form-control");
  setAttributes(input,"type,text/dummy,dummy");
  input.value = dataName;
  input.id = "inpDataName";

  input.addEventListener('blur', function() {
    //alert(1);
    var val = document.getElementById("inpDataName").value;
    document.getElementById("inpDataName").remove();
    // event.target.innerText = val;
    parentObj.innerText = val;
    // console.log(val);
    // console.log(fileKey);
    // console.log(sheetIdx);
    updateSheetDataName(fileKey, sheetIdx, val);
    //return;
  });
  return input;
}

function updateSheetDataName(fileKey, sheetIdx, DataNameValue){
  fetch('/updateSheetDataName/' + fileKey + "/" + sheetIdx + "/" + DataNameValue, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    //alert(list[0]);
  })
  .catch(error => { 
    console.log(error)
  });

}

function collectSheetData(fileName, fileNameOrg, sheetIdx, sheetName, rowSize, statusObjId, rowId){
  fetch('/collectSheetData/' + fileName + "/" + fileNameOrg + "/" + sheetIdx + "/" + sheetName + "/" + rowId, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    document.getElementById(statusObjId).innerText = rowId;
    //alert(list[0].rowId);
    if(Number(list[0].rowId) >= Number(rowSize)){
      return;
    }else{
      collectSheetData(list[0].fileName, list[0].fileNameOrg, list[0].sheetIdx, list[0].sheetName, rowSize, statusObjId, Number(list[0].rowId)+1);
    }
    // if(value==0){
    //   SetAllDisabledDutyList();
    //   //alert("登録しました。");
    // }
  })
  .catch(error => { 
    console.log(error)
    //document.getElementById("divLabelProcessing0").innerText = error;//console.log(error); 
    //openErrorMessageDialog(error);
    alert(1);
  });
}