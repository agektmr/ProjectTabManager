ProjectTabManager
=================

普段 Chrome でタブを開きすぎて困っているなんてことはありませんか？

Project Tab Manager はウィンドウをひとつのプロジェクトと考え、プロジェクトごとにタブをセットとして保存できる Chrome Extension です。プロジェクトはブックマークとして保存されるので、Chrome for Android や Chrome for iOS の環境からでも手軽に開くことができます。

この Extension はまだ未完成なため Chrome Web Store で公開していませんが、下記の手順でインストールすることができます。

1. ProjectTabManager を clone
2. Chrome で extension のページを開く (chrome://chrome/extensions)
3. 右上の Developer Mode をチェック
4. Load Unpacked Extension... をクリック
5. clone したフォルダを選択

この Chrome Extension は元々 vanilla js (素の JavaScript) で開発しましたが、AngularJS 学習の目的で途中から書き換えました。"ng-"で始まるファイルはすべて Angular 関連のものになるので、Angular を学習している方は"ng-"で始まるファイルを見て頂くと良いと思います。