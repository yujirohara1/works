const C_VERSION_DATE = [
  "",  
  "2022 / 3 / 27 (日)",  
  "2022 / 3 / 20 (日)",  
  "2022 / 3 / 13 (日)",  
  "2022 / 3 /  6 (日)",  
  ""
];

const C_VERSION_NOTE = [
  "",  
  "性能改善。分析テーブルが1000万件に迫り表番号、行番号、列番号にインデックスを追加。\r\n バブルチャートに３軸目を追加。\r\n 行列テーブルに事業属性の３列を追加。\r\n 更新履歴モーダル追加。遡りで開発ログを補記。",  
  "スキャッターチャートを実装。\r\n その他 CSS、UI/UXの随時見直し。",  
  "レーダーチャート、業種選択、政府統計へのクロールを実装。\r\nHerokuの都合で1リクエスト30秒以内でなければならず長時間かかる処理はクライアント側で小分けにして呼ぶ。 \r\n その他 CSS、UI/UXの随時見直し。",  
  "最初のソースをデプロイ。ダイジェストタブと統計ヒストリータブを実装。\r\n サイト名を仮決定、DiAna で ダイアナ。診断 Diagnosis ダイアグノーシス と 分析 Analysys アナリシス をくっつけて。\r\n バックエンドは Python, DBは PostgreSQL、フロントエンドは Bootstrap5系, ChartJS3系, JSはバニラを徹底。\r\n HTMLはハムリッシュ記法とする。",  
  ""];

function getVersionHistoryDate(i){
  var dt = document.createElement("dt");
  try{
    if(C_VERSION_DATE[i] != ""){
      dt.innerHTML = C_VERSION_DATE[i];
      dt.style.fontSize = "14px";
      dt.style.float = "left";
      return dt;
    }
  }catch(e){
  }
  return null;
}

function getVersionHistoryNote(i){
  var dd = document.createElement("dd");
  try{
    if(C_VERSION_NOTE[i] != ""){
      dd.innerText = C_VERSION_NOTE[i];
      dd.style.fontSize = "14px";
      dd.style.marginLeft = "150px";
      return dd;
    }
  }catch(e){
  }
  return null;
}