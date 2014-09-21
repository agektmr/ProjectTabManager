## Version 3.0.0
* Project Tab Manager now treats **all** windows as projects.
    * No need to manually create project
    * Click on "edit" button beside project name to rename
    * A bookmark will be created when you bookmark one of tabs by clicking a star
* Better session tracking: Sessions can be resumed in any situations including:
    * Launching Chrome
    * Recovery from crash
    * Opening a profile
* "Pin" feature is deprecated
* Tab order is now synching better than before
* Retina display support
* New icons
* Favicons are now cached in database

## Version 2.2.3
* Fixed a bug that changes active tab behind focused window when clicking on a bookmark that is open project but not active.

## Version 2.2.2
* Bold project name when the project is open

## Version 2.2.1
* Add new project by typing "return" on project name input

## Version 2.2.0
* **Drastic performance improvement**
* Source code re-organization

## Version 2.1.1
* Fixed flexbox issue for non-vendorprefix unsupported stable channel
* Added starring effect

## Version 2.1.0
* Refactored internal structure for better maintenance.
* Project order is now aligned to what appears on actual bookmark list.
* Session handling is significantly improved.
* Slight design change.

## Version 2.0.5
* Pop up history page only if the version changes in major (ex 2.0.0) or minor (ex 2.1.0). Trivial change (ex 2.1.1) won't popu up anymore.

## Version 2.0.4
* Added link to Japanese help (I mean, my blog!)
* Fixed cache strength on session changes

## Version 2.0.3
* Opening pop up is now much much faster.

## Version 2.0.2
* Quick fix on bookmark initialization.

## Version 2.0.1
* Bug fixes.
    * Console logs are now disabled.
    * Summary works better.
    * History log will be removed after 2 month.
    * Options were busted. Now it works ok.

## Version 2.0.0
* Project Tab Manager has got a major update. Check out these killer features!
* Enhanced UI. Project Tab Manager UI has got much better, more intuitive and friendlier than before.
* Project Tab Manager now tracks all your open tabs. Feel free to close windows. You can always resume from where you were by opening the same project. Bookmark by turning on stars beside your open tab list under project if you think you will open it again.
* Automatically restores previous sessions and project assignments to windows.
* Keyboard navigation is now available. Open Project Tab Manager, search, then you can navigate through projects by pressing "tab" key. Press "return" to open selected project.
* Options is now stored in the cloud. Your configurations will be consistent among all your environments (if you are signed into Chrome).
* Better summary. You can now summarize your time spent on each projects better. Your session will be tracked for 2 months.


## Version 1.0.3
* Fixed wrong passive bookmark representation.
* Fixed wrong behavior on lazy load.
* other bug fixes.


## Version 1.0.2
* Fixed blocking bug causing no response when clicking on session name.
