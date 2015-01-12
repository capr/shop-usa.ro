@echo off
setlocal
rem clone a package (or all packages) from remote, or list uncloned packages

if [%1] == [] goto usage
if [%1] == [--all] goto clone_all
if [%1] == [--list] goto list_uncloned

if exist _git/%1/.git/ goto already_cloned

if [%2] == [] (
	if not exist _git/%1.origin goto unknown_origin
	for /f "delims=" %%o in (_git/%1.origin) do (
		if not exist _git/%%o.baseurl goto unknown_origin
		for /f "delims=" %%u in (_git/%%o.baseurl) do set url=%%u%1
	)
) else (
	if exist _git/%2.baseurl (
		for /f "delims=" %%s in (_git/%2.baseurl) do set url=%%s%1
	) else (
		set url=%2
	)
)

md _git\%1
set GIT_DIR=_git/%1/.git

git init
git config --local core.worktree ../../..
git config --local core.excludesfile %1.exclude
git remote add origin %url%
git fetch --depth=1 --recurse-submodules
git branch --track master origin/master
git checkout

goto end

:clone_all
for /f "delims=" %%p in ('clone --list') do call clone %%p
goto end

:list_uncloned
for %%f in (_git/*.origin) do call :check_uncloned %%f
goto end

:check_uncloned
set s=%1
set s=%s:.origin=%
if not exist _git/%s%/.git echo %s%
goto end

:usage
echo.
echo USAGE:
echo    %0 ^<package^> ^[origin ^| url^]    clone a package
echo    %0 --list                      list uncloned packages
echo    %0 --all                       clone all packages
echo.
goto end

:unknown_origin
echo.
echo ERROR: unknown origin url for %1
goto usage

:already_cloned
echo.
echo ERROR: %1 already cloned
goto usage

:end
