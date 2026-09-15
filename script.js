const samples = {
  basic: `#include <stdio.h>\n\nint main(void){\n    int a = 3;\n    int b = 5;\n    int c = a + b;\n    printf("%d\\n", c);\n    return 0;\n}`,
  if: `#include <stdio.h>\n\nint main(void){\n    int score = 78;\n\n    if(score >= 60){\n        printf("合格です\\n");\n    }\n    if(score <= 20){\n        printf("不合格です\\n");\n    }else{\n        printf("再挑戦です\\n");\n    }\n\n    return 0;\n}`,
  for: `#include <stdio.h>\n\nint main(void){\n    int i;\n    int sum = 0;\n\n    for(i = 1; i <= 5; i++){
        sum = sum + i;\n    }\n\n    printf("%d\\n", sum);\n    return 0;\n}`,
  nested: `#include <stdio.h>\n\nint main(void){\n    for(int i=1;i<=3;i++){\n        for(int j=1;j<=3;j++){\n            printf("%d - %d\\n",i,j);\n        }\n    }\n\n    return 0;\n}`,
  triangle: `#include <stdio.h>\n\nint main(void){\n    int x, y;\nfor (y=1; y<=5; y++) {\n   for (x=1; x<=5; x++) {\n            if (x<=5-y) {\n                printf(" ");\n            } \n            else {\n                printf("*");\n            }\n        }\n        printf("\\n");\n    }\n    return 0;\n}`,
  mistake: `#include <stdio.h>\n\nint main(void){\n    int x = 10\n    int y = 20;\n    scanf("%d", y);\n    if(x = y){\n        printf("同じです\\n");\n    }\n    return 0;\n}`,
  switch: `#include <stdio.h>\n\nint  main(void){\n    int n = 2;\n    \n    switch (n) {\n        case 1:\n            printf("One");\n            break;\n        case 2:\n            printf("Two");\n            break;\n        default:\n            printf("Other");\n    }\n    return 0;\n}`,
  mistake: `#include <stdio.h>\n\nint main(void){\n    int x = 10\n    int y = 20;\n    scanf("%d", y);\n    if(x = y){\n        printf("同じです\\n");\n    }\n    return 0;\n}`,
  Array:`#include <stdio.h>\n\nint  main(void){\n    int nums[] = {10, 20, 30};\n    int length = sizeof(nums) / sizeof(nums[0]);\n    for (int i = 0; i < length; i++) {\n        printf("%d\\n", nums[i]);\n    }\n    return 0;\n}`,
  MultiArraypleMatch:`#include <stdio.h>\n\nint  main(void){\n    int matrix[2][3] = {\n       {1, 2, 3},\n       {4, 5, 6}\n    };\n    \n    for (int i = 0; i < 2; i++) {\n        for (int j = 0; j < 3; j++) {\n            printf("%d ", matrix[i][j]);\n        }\n        printf("\\n");\n    }\n    \n    return 0;\n}`

  
};//初期に出てくるソースコードたち

function escapeHtml(str){
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}//文字列内にあるその文字をすべて置換する

function resetCode(){//入力、表示エリアを殻にする
  editor.setValue('');
  document.getElementById('codePreview').innerHTML = '';
  document.getElementById('variableState').innerHTML = '';
  document.getElementById('flowchartResult').textContent = '';
  document.getElementById('hintResult').innerHTML = '';
}

function loadSample(type){
 editor.setValue(samples[type] || '');//|| '';はもしtypeでしていされたコードがサンプルになかった時空白にするエラーを起こさせない
  analyzeCode();//htmlanalyzeCodeお呼び出し
}

function addAnalysis(map, lineNo, text){//コードと説明のテキスト表示
  if(!map[lineNo]){//もし、linenoの場所がまだないなら[]を作成する
    map[lineNo] = [];
  }
  map[lineNo].push(text);//linenoにプッシュ
}

function addHint(list, lineNo, title, text){//ミス・ヒントのところリストにヒントをため込んでいく
  list.push(`<div class="warning-line"><strong>${lineNo}行目：${title}</strong><br>${text}</div>`);
}


function shouldProbablyEndWithSemicolon(trimmed){//セミコロンつけるか判定
  if(trimmed === '') return false;//空白の場合
  if(trimmed.endsWith(';')) return false;//もうセミコロンついてる
  if(trimmed.endsWith('{') || trimmed.endsWith('}')) return false;//ループとかの関数の始まりにはいらん
  if(/^#/.test(trimmed)) return false;
  if(/^if\s*\(/.test(trimmed)) return false;
  if(/^else\b/.test(trimmed)) return false;
  if(/^for\s*\(/.test(trimmed)) return false;
  if(/^while\s*\(/.test(trimmed)) return false;
  if(/^switch\s*\(/.test(trimmed)) return false;
  if(/^do\b/.test(trimmed)) return false;//上のは；いらない
  return /(=|printf\s*\(|scanf\s*\(|return\b|int\s+|float\s+|double\s+|char\s+)/.test(trimmed);//セミコロンが必要な命令文たち
}

function extractLoopVar(initText){//繰り返し内の変数名を取り出す
  const normalized = initText.replace(/^int\s+/, '').trim();
  const match = normalized.match(/^([a-zA-Z_]\w*)\s*=/);
  return match ? match[1] : '反復';
}

//codemirrorのエディタ
const editor = CodeMirror.fromTextArea(document.getElementById('codeInput'),{
  lineNumbers:true,//行番号表示const
  matchBrackets:true,//括弧
  mode:'text/x-csrc',//文字の色
  lineWrapping: true,//長い行を折り返す
  extraKeys:{//候補を探す
    'Ctrl-Space': 'autocomplete'
  }
});

const cKeywords = [//ワードの候補
  'int','float','double','char','void','const','for','if','else','while','switch','case','default',
  'break','return','printf','scanf','include','main','function','auto','do','enum','extern','goto','inline',
  'long','register','restrict','short','signed','sizeof','static','struct','typedef','union','unsigned','volatile'
];

CodeMirror.registerHelper('hint','clike',function(cm){
  const cursor = cm.getCursor();
  const token = cm.getTokenAt(cursor);
  const start = token.start;
  const end = cursor.ch;
  const currentWord = token.string;

  const list = cKeywords.filter(function(word){
    return word.toLowerCase().startsWith(currentWord.toLowerCase());

  });
  return{
    list: list.length ? list : cKeywords,
    from: CodeMirror.Pos(cursor.line,start),
    to: CodeMirror.Pos(cursor.line,end)
  };
});

function analyzeCode(){
  const code = editor.getValue().replace(/\r\n/g, '\n');
  const lines = code.split('\n');//\nで分割
  const analysis = {};
  const flowchart = [];
  const hints = [];
  const highlightLines = new Set();//注目のポイント
  const variableState = {};//状態
  const variableOrder = [];//順番

  let braceBalance = 0;//関数内にいるのか
  let hasMain = false;
  let hasFlowEnd = false;
  const loopStack = [];//るーぷの状態
  const blockStack = [];//ブロックの状態（二重ループとかに使う）

  function currentLoopDepth(){
    return loopStack.length;//こいつの長さ　重ループ個数
  }

  function pushFlow(text, depth = 0,type = 'process'){
    
    flowchart.push(`<div class="flow-node flow-${type}">${text}</div>`);
  }

  function pushArrow(depth = 0){
    flowchart.push(`↓`);//深さまでの下矢印
  }
 

  pushFlow('開始',0,'start');
  pushArrow(0);//上のpushArrowを呼び出す

  lines.forEach((rawLine, index) => {//70行目をチェックしてください　下の処理を引数で引数で指定されただけ順番に実行
    const lineNo = index + 1;//行番号
    const line = rawLine;//現在の行のテキストをlineにコピーしておく
    const trimmed = line.trim();//空白削除など
    const currentDepth = currentLoopDepth();//何重のループの中にいる行か

    for(const ch of trimmed){//trimmedから一文字ずつ取り出しループする
      if(ch === '{') braceBalance++;//取り出した文字（ch）が｛・・・＋１
      if(ch === '}') braceBalance--;//　　　　　　　　　　　｝・・・-1
    }//braceBlanceが0になっていなければかっこ閉じてないとわかる

    if(trimmed.match(/^int\s+main\s*\(/)){//メイン関数かの判定
      hasMain = true;
      addAnalysis(analysis, lineNo, '実行開始です。');
      return;
    }

    if(trimmed === ''){//空欄見っけ
      addAnalysis(analysis, lineNo, '空欄です。');
      return;
    }
    const linecommentMatch = trimmed.match(/^\/\/(.*)$/);//一行コメント
    if(linecommentMatch){
      addAnalysis(analysis,lineNo,'コメントです');
     return;
    }
    
    const blockcommentMatch = trimmed.match(/^(\/\*|\*\/|\*)/);//コメント
    if(blockcommentMatch){
      addAnalysis(analysis,lineNo,'コメントです');
     return;
    }
    

    let checkTarget = trimmed;
    if(trimmed.includes('printf')){//文字列が含まれているか
      checkTarget = trimmed.replace(/".*?"/g, '');//文字列を空白に置き換える
    }

    if(/[Ａ-Ｚａ-ｚ０-９（）｛｝［］；，％＋－＊／＝＜＞”’　]/.test(checkTarget)){//全角がありますか
      addHint(//addHintを呼び出して表示
        hints,
        lineNo,
        '全角文字の可能性',
        'printfの文字列以外の部分に、全角の英数字・記号・スペースが含まれている可能性があります。半角で入力されているか確認してみましょう。'
      );
      highlightLines.add(lineNo);//lineNo・・・エラーが見つかった行の番号　ハイライトする行のリストにいれておく
    }

    if(/^#include\s*</.test(trimmed)){//ライブラリの検出
      addAnalysis(analysis, lineNo, '定型文（標準ライブラリ読込）。');
      return;
    }

    const multiDeclMatch = trimmed.match(/^(int|float|double|char)\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)+)\s*;$/);//型宣言おんなじ＋複数を見つけ出す\s*,\s*「カンマ+変数名」のセット1回以上繰り返す
    if(multiDeclMatch){//                                                                                ↑一回以上繰り返されるを表す
      const type = multiDeclMatch[1];//型を代入
      const names = multiDeclMatch[2].split(',').map(v => v.trim());//変数名取り出し，で区切ってく自動的にvに文字列が入り空白除去
      names.forEach(name => {//forEachの呼び出し
        if(!(name in variableState)) variableOrder.push(name);//変数がvariableState内にない場合variableOrder（順番）に名前を追加
        variableState[name] = '未代入';//まだ値が入っていないから
      });
      addAnalysis(analysis, lineNo, `${type}型の変数 <code>${names.join('</code>, <code>')}</code> を宣言しています。`);
      pushFlow(`変数 <code>${names.join(', ')}</code> を宣言`, currentDepth,'process');//フローチャート用
      pushArrow(currentDepth);//現在の深さ
      return;
  }

 
const MultiArraypleMatch = trimmed.match(/^(int|float|double|char)\s+([a-zA-Z_]\w*)((?:\s*\[[^\]]*\]){2,})\s*(=\s*\{.*\}?)?;?$/); // 多次元配列

if (MultiArraypleMatch) {
    const type = MultiArraypleMatch[1];
    const name = MultiArraypleMatch[2];
    const dimspart = MultiArraypleMatch[3];
   
    const hasInit = MultiArraypleMatch[4] || trimmed.includes('=') || trimmed.includes('{');// 初期化ありか見る　=,{があれば初期化

    const sizes = [...dimspart.matchAll(/\[([^\]]*)\]/g)].map(m => m[1].trim());//...は配列にしている　map見つかったところから数だけ取り出す
    const sizeStr = sizes.map(s => s === '' ? '?' : s).join('][');//配列づくり　空白の場合は?
    const dimensionCount = sizes.length;//長さを数える

    if (!(name in variableState)) {
       variableOrder.push(name); 
      }
    variableState[name] = `${dimensionCount}次元配列`;

    let message = `${type}型の<strong>${dimensionCount}次元配列</strong> <code>${name}[${sizeStr}]</code> を宣言しています`;
    if (hasInit) {
        message += `（初期化が始まります）`;
    }
    
    addAnalysis(analysis, lineNo, message);
    pushFlow(`${dimensionCount}次元配列 ${name}[${sizeStr} を宣言`,currentDepth ,'process');
    pushArrow(currentDepth);
    return;
}


if (trimmed.match(/^\{.*\},?$/) && !trimmed.endsWith(';')) {//初期化リスト中身
    addAnalysis(analysis, lineNo, `配列の要素（初期化データ）を記述しています。`);
    return;
}


if (trimmed === '};') {//初期化リスト閉じ
    addAnalysis(analysis, lineNo, `配列の初期化ブロックを終了します。`);
    return;
}

const ArrayMatch = trimmed.match(/^(int|float|double|char)\s+([a-zA-Z_]\w*)\s*\[([^\]]*)\]\s*(=\s*\{.*\})?;$/); // 配列を探す
if (ArrayMatch) {
  const type = ArrayMatch[1]; //型
  const name = ArrayMatch[2]; //名前
  const size = ArrayMatch[3].trim(); //配列の長さ
  const init = ArrayMatch[4]; //配列の中身（無いとき undefined）

  if (!(name in variableState)) {
    variableOrder.push(name);
  }
  variableState[name] = '配列';

  //初期化なし: int a[3] int a[]
  if (!init) {
    if (size === '') {// int a[];
      addAnalysis(analysis,lineNo,`${type}型の配列 <code>${name}[]</code> を宣言しています。サイズが指定されていません。`);
      addHint(hints,lineNo,'配列のサイズ','サイズを書くか、<code>int a[] = {1, 2, 3};</code> のように初期化で個数を決めてください。');
      highlightLines.add(lineNo);
      pushFlow(`${type}型の配列 ${name}[] を宣言`, currentDepth, 'process');
    }
    else {// int a[3];
      addAnalysis(analysis,lineNo,`${type}型の配列 <code>${name}[${size}]</code> を宣言しています。`);
      pushFlow(`${type}型のサイズ${size}の配列${name}[]を宣言`, currentDepth, 'process');
    }
    pushArrow(currentDepth);
    return;
  }

  //初期化あり
  const Newinit = init.replace(/[={}]/g, '').trim();
  const elements =
    Newinit === ''
      ? []
      : Newinit.split(',').map((s) => s.trim()).filter((s) => s !== '');

  if (size === '') {// int a[] = {1, 2, 3};
    addAnalysis(analysis,lineNo,`${type}型の配列 <code>${name}[]</code> を作成しています。中身は <code>${escapeHtml(Newinit)}</code> です。`);
    pushFlow(`${type}型の配列 ${name}[] を作成`, currentDepth, 'process');
    pushArrow(currentDepth);
    return;
  }

  if (!isNaN(Number(size)) && Number(size) !== elements.length) {// 長さと要素数が一致しない
    addAnalysis(analysis,lineNo,`${type}型の配列 <code>${name}[${size}]</code> を作成しています。中身は <code>${escapeHtml(Newinit)}</code> です。`);
    addHint(hints,lineNo,'配列の中身と長さに注意',`長さは ${size} ですが、初期化の要素は ${elements.length} 個です。一致しているか確認してください。`);
    highlightLines.add(lineNo);
    pushFlow(`${type}型,長さ${size}の${name}という配列作成`, currentDepth, 'process');
    pushArrow(currentDepth);
    return;
  }

  // 一致している（または size が数字以外）
  addAnalysis(analysis,lineNo,`${type}型の配列 <code>${name}</code> を作成しています。サイズは <code>${size}</code> です。中身は <code>${escapeHtml(Newinit)}</code> です。`);
  pushFlow(`${type}型の${name}という配列作成`, currentDepth, 'process');
  pushArrow(currentDepth);
  return;
}

    const declMatch = trimmed.match(/^(int|float|double|char)\s+([a-zA-Z_]\w*)\s*(=\s*(.+))?;$/);//int a = 10;みたいな代入も行う時
    if(declMatch){
      const type = declMatch[1];//型
      const name = declMatch[2];//変数名
      const value = declMatch[4];//代入した値or式
      if(!(name in variableState)) variableOrder.push(name);
      variableState[name] = value ? value.trim() : '未代入';//valueに中身があるか
      if(value){
        addAnalysis(analysis, lineNo, `${type}型の変数 <code>${name}</code> を宣言し、<code>${escapeHtml(value.trim())}</code> を代入しています。`);
        pushFlow(`変数 ${name} を宣言して ${value.trim()} を代入`, currentDepth,'process');
      }else{
        addAnalysis(analysis, lineNo, `${type}型の変数 <code>${name}</code> を宣言しています。`);
        pushFlow(`変数 ${name} を宣言`, currentDepth,'process');
      }
      pushArrow(currentDepth);
      return;
    }

    const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+);$/);//代入を探す
    if(assignMatch && !/^if\s*\(/.test(trimmed) && !/^while\s*\(/.test(trimmed) && !/^for\s*\(/.test(trimmed)){//最初だけ肯あとは否
      const name = assignMatch[1];//変数名
      const expr = assignMatch[2].trim();//要素　変数状態と説明を更新
      if(!(name in variableState)) variableOrder.push(name);
      variableState[name] = expr;//更新
      addAnalysis(analysis, lineNo, `変数 <code>${name}</code> に <code>${escapeHtml(expr)}</code> を代入しています。`);
      pushFlow(`${name} に ${expr} を代入`, currentDepth,'process');
      pushArrow(currentDepth);
      return;
    }

    const printfMatch = trimmed.match(/^printf\s*\((.*)\)\s*;$/);//表示探す
    if(printfMatch){//表示ならば
      addAnalysis(analysis, lineNo, '画面に結果を表示しようとしています。');
      pushFlow('画面に表示', currentDepth ,'display');
      pushArrow(currentDepth);
      return;
    }

    const scanfMatch = trimmed.match(/^scanf\s*\((.*)\)\s*;$/);//入力を探す
    if(scanfMatch){
      addAnalysis(analysis, lineNo, 'キーボードから値を受け取ろうとしています。');
      pushFlow('キーボードから入力', currentDepth,'input');
      pushArrow(currentDepth);
      if(!/&\s*[a-zA-Z_]\w*/.test(trimmed)){//＆で書かれていないよ
        addHint(hints, lineNo, 'scanfの書き方を確認', '整数などを読み取るときは、変数の前に <code>&</code> が必要な場合があります。入力先の書き方を見直してみましょう。');
        highlightLines.add(lineNo);
      }
      return;
    }

    const ifMatch = trimmed.match(/^if\s*\((.*)\)\s*\{?$/);//if else判定
    if(ifMatch){//マッチしたら
      if(currentDepth >= 2){
        addAnalysis(analysis, lineNo, `表示を切り替える条件です。<code>${escapeHtml(ifMatch[1])}</code> で判定しています。`);
      }else{
        addAnalysis(analysis, lineNo, `条件分岐です。<code>${escapeHtml(ifMatch[1])}</code> で判定しています。`);
      }
      pushFlow(`${ifMatch[1].trim()}`, currentDepth,'if');//テンプレートリテラル<>はifのひし形　currentDepthは第二引数
      pushArrow(currentDepth);
      pushFlow(`はいの場合の処理 `, currentDepth,'process');//テンプレートリテラル<>はifのひし形　currentDepthは第二引数
      pushArrow(currentDepth);
      if(trimmed.includes('{')){
        blockStack.push({ type: 'if', depth: currentDepth });
      }
      if(/[^=!<>]=[^=]/.test(ifMatch[1])){//＝が足りない
        addHint(hints, lineNo, '条件式の = に注意', '条件を比べたい場面では <code>==</code> を使うことがあります。代入の <code>=</code> になっていないか確認してみましょう。');
        highlightLines.add(lineNo);
      }
      return;
    }

    if(/^else\s*if\b/.test(trimmed)){
      addAnalysis(analysis, lineNo, 'ifが成り立たないときの処理。');
      pushFlow('それともの場合の処理', currentDepth,'process');
      pushArrow(currentDepth);
      if(trimmed.includes('{')){
        blockStack.push({ type: 'else if', depth: currentDepth });
      }
      return;
    }

    if(/^else\b/.test(trimmed)){
      addAnalysis(analysis, lineNo, 'すべての条件が成り立たなかった場合の処理です。');
      pushFlow('いいえの場合の処理', currentDepth,'process');
      pushArrow(currentDepth);
      if(trimmed.includes('{')){
        blockStack.push({ type: 'else', depth: currentDepth });
      }
      return;
    }
    const switchMatch = trimmed.match(/^switch\s*\((.*?)\)\s*\{$/);//switch探し
      if(switchMatch){
		const switchint = escapeHtml(switchMatch[1].trim());
        addAnalysis(analysis, lineNo, `値によって処理を変更する条件です。<code>${escapeHtml(switchMatch[1])}</code> で変更しています。`);
        pushFlow(`switch(${switchint})文`,currentDepth,'switch');
        pushArrow(currentDepth);
        return;
	}
	const caseMatch = trimmed.match(/^case\s(.*?)\s*:$/i);//case探し
	  if(caseMatch){
		  const caseNo = escapeHtml(caseMatch[1].trim());
		  addAnalysis(analysis, lineNo, `値が<code>${escapeHtml(caseMatch[1])}</code>の時の処理です `);
		  pushFlow(`case${caseNo}の処理`,currentDepth,'process');
		  pushArrow(currentDepth);
      return;
    }
    


  const caseNospaceMatch = trimmed.match(/^case([^\s:])/i);
    if (caseNospaceMatch){
      addHint(hints, lineNo, 'caseと番号の間に注意','case文を使いたい時はcase文と番号の間に空白を入れるという決まりがあります確認してください');
        highlightLines.add(lineNo);
        pushFlow(`caseの処理?`,currentDepth,'process');
        pushArrow(currentDepth);
        return;
       }
       
  

     const breakMatch = trimmed.match(/^\s*break;$/i);//break探し
     if(breakMatch){
		  addAnalysis(analysis, lineNo, `条件処理を抜けます。 `); 
		  return;
}

     const defaultMatch = trimmed.match(/^\s*default:$/i);//default探し
	  if(defaultMatch){
		  addAnalysis(analysis, lineNo, `どの処理にも当てはまらなかった時の処理です。 `);
		  pushFlow(`defaultの処理`,currentDepth,'process');
		  pushArrow(currentDepth);
		  blockStack.push({ type: 'default', depth: currentDepth }); 
		  return;
}
        
    const forMatch = trimmed.match(/^for\s*\((.*?);(.*?);(.*?)\)\s*\{?$/);//for探し
    if(forMatch){
      const init = escapeHtml(forMatch[1].trim());//初期化
      const condition = escapeHtml(forMatch[2].trim());//継続条件
      const update = escapeHtml(forMatch[3].trim());//更新処理
      const nextLoopDepth = currentDepth + 1;
      const role = nextLoopDepth === 1 ? '外側' : nextLoopDepth === 2 ? '内側' : 'さらに内側';
      const loopVar = extractLoopVar(forMatch[1].trim());

      if(nextLoopDepth === 1){
        addAnalysis(analysis, lineNo, `外側のループです。<code>${init}</code> から始め、<code>${condition}</code> の間くり返します。`);
      }else if(nextLoopDepth === 2){
        addAnalysis(analysis, lineNo, `内側のループです。<code>${init}</code> から始め、<code>${condition}</code> の間くり返します。`);
      }else{
        addAnalysis(analysis, lineNo, `さらに内側のループです。`);
      }

      pushFlow(`${role}のループ開始: ${forMatch[1].trim()}; ${forMatch[2].trim()}; ${forMatch[3].trim()}`, currentDepth,'for');
      pushArrow();//矢
      loopStack.push({ depth: nextLoopDepth,lineNo, role, loopVar });
      return;
    }

    const whileMatch = trimmed.match(/^while\s*\((.*)\)\s*\{?$/);//while探し
    if(whileMatch){
      addAnalysis(analysis, lineNo, `whileループです。<code>${escapeHtml(whileMatch[1])}</code> の間くり返します。`);
      pushFlow(`while ループ開始: ${whileMatch[1].trim()}`, currentDepth,'while');
      pushArrow(currentDepth);
      blockStack.push({ type: 'while', depth: currentDepth });
      return;
    }

    const returnMatch = trimmed.match(/^return\s+(.+)\s*;$/);//return探し
    if(returnMatch){
      addAnalysis(analysis, lineNo, `<code>${escapeHtml(returnMatch[1].trim())}</code> を返して処理を終えようとしています。`);
      pushFlow('終了',currentDepth,'finish');
      hasFlowEnd = true;
      return;
    }

    if(trimmed === '{'){
      addAnalysis(analysis, lineNo, '処理のまとまり開始です。');
      return;
    }

    if(trimmed === '}'){
      let message = '処理のまとまり終了です。';
      const topLoop = loopStack[loopStack.length - 1];
      const topBlock = blockStack[blockStack.length - 1];

      if(topLoop && topLoop.depth === currentDepth){
        if(topLoop.depth === 2){
          message = '内側のまとまり終了です。';
        }else if(topLoop.depth === 1){
          message = '外側のまとまり終了です。';
        }else{
          message = 'さらに内側のまとまり終了です。';
        }
        pushFlow(`${topLoop.role}のループ終了 → 次の ${topLoop.loopVar} へ`, Math.max(0, topLoop.depth - 1),'forfinish');
        pushArrow(currentDepth);
        loopStack.pop();
      }else if(topBlock){
        if(topBlock.type === 'if'){
          message = 'if のまとまり終了です。';
        }else if(topBlock.type === 'else'){
          message = 'else のまとまり終了です。';
        }else if(topBlock.type === 'else if'){
          message = 'else ifのまとまり終了です。';
        }
        else if(topBlock.type === 'while'){
          message = 'while のまとまり終了です。';
        }
        blockStack.pop();
      }

      addAnalysis(analysis, lineNo, message);
      return;
    }

    if(shouldProbablyEndWithSemicolon(trimmed)){
      addHint(hints, lineNo, 'セミコロンの不足かも', '文末に <code>;</code> が必要な可能性があります。直前の行も含めて見直してみましょう。');
      highlightLines.add(lineNo);
    }

    addAnalysis(analysis, lineNo, '説明未対応コードか、エラーがあります。');
  });

  if(!hasMain){
    hints.unshift(`<div class="warning-line"><strong>main関数が見当たりません</strong><br>学習用の基本的なCプログラムでは、<code>int main(void)</code> などの開始地点を書くことが多いです。</div>`);
  }

  if(braceBalance !== 0){
    hints.push(`<div class="warning-line"><strong>波かっこの数を確認</strong><br><code>{</code> と <code>}</code> の数が対応していない可能性があります。処理のまとまりの始まりと終わりを追ってみましょう。</div>`);
  }

  if(!hasFlowEnd){
    pushFlow('終了',currentDepth,'finish');
  }

  const previewHtml = lines.map((line, index) => {//解析結果からhtml作成
    const lineNo = index + 1;
    const highlighted = highlightLines.has(lineNo) ? ' highlight-line' : '';//setに行番号あるか
    const safeText = escapeHtml(line) || '&nbsp;';//空行でも高さ消さない　空白用htmlを使う
    const lineAnalysis = analysis[lineNo] || [];//説明がない行では空白
    const analysisHtml = lineAnalysis.length//この行に対する解析メッセージが一つでも存在するか
      ? `<div class="line-analysis">${lineAnalysis.map(text => `<div class="line-analysis-item">${text}</div>`).join('')}</div>`//yes
      : `<div class="line-analysis line-analysis-empty">この行の説明はまだありません。</div>`;//no

    return `
      <div class="code-card${highlighted}">
        <div class="code-line">
          <div class="code-line-number">${lineNo}</div>
          <div class="code-line-text">${safeText}</div>
        </div>
        ${analysisHtml}
      </div>
    `;
  }).join('');

  const variableHtml = variableOrder.length//変数状態
    ? variableOrder.map(name => `<div class="variable-chip">${escapeHtml(name)} = ${escapeHtml(String(variableState[name]))}</div>`).join('')
    : `<div class="note">変数の状態はまだ見つかっていません。</div>`;

  document.getElementById('codePreview').innerHTML = previewHtml;//（）のidを取り出し、=に置き換える
  document.getElementById('variableState').innerHTML = variableHtml;
  document.getElementById('flowchartResult').innerHTML =flowchart.join('');//フローチャート用
  document.getElementById('hintResult').innerHTML = hints.length
    ? hints.join('') + `<div class="hint"><b>見方のコツ</b><br>ヒントは答えそのものではなく、<span class="highlight">どこを疑うべきか</span> を示しています。まずは強調された行と、その一つ前の行も一緒に確認してみましょう。</div>`
    : `<div class="hint"><b>大きなミスは見つかっていません。</b><br>次は、変数の値がどう変わるか、条件式がどんな場合に真になるかを自分の言葉で説明できるか試してみましょう。</div>`;
}

analyzeCode();

