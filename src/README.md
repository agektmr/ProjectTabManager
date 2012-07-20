ProjectTabManager
=================

普段 Chrome でタブを開きすぎて困っているなんてことはありませんか？  
Don't you open too many tabs on Chrome?

Project Tab Manager はウィンドウをひとつのプロジェクトと考え、プロジェクトごとにタブをセットとして保存できる Chrome Extension です。プロジェクトはブックマークとして保存されるので、Chrome for Android や Chrome for iOS の環境からでも手軽に開くことができます。  
Project Tab Manager is a Chrome Extension that lets you store tab sets per project, considering windows as projects. Storing projects as bookmarks on Chrome, you can use them even on Chrome for Android or Chrome for iOS which don't support extensions.

この Extension はまだ未完成なため Chrome Web Store で公開していませんが、下記の手順でインストールすることができます。  
This Extension is incomplete and isn't on Chrome Web Store but you can install onto your Chrome by following procedure:

1. ProjectTabManager を clone  
   Clone ProjectTabManager to your local env.
2. Chrome で extension のページを開く (chrome://chrome/extensions)  
   Open Chrome Extension page on Chrome (chrome://chrome/extensions)
3. 右上の Developer Mode をチェック  
   Check "Developer Mode" on right top most of the window
4. Load Unpacked Extension... をクリック  
   Click "Load Unpacked Extension..."
5. clone したフォルダを選択  
   Select the cloned folder



この Chrome Extension は元々 vanilla js (素の JavaScript) で開発しましたが、AngularJS 学習の目的で途中から書き換えました。"ng-"で始まるファイルはすべて Angular 関連のものになるので、Angular を学習している方は"ng-"で始まるファイルを見て頂くと良いと思います。  
This Chrome Extension was originally written using vanilla js, then converted to AngularJS base for learning purpose. Files starting with "ng-" are Aungular related. If you are interested in learning Angular, check out files starting with "ng-".

AngularJS: http://angularjs.org