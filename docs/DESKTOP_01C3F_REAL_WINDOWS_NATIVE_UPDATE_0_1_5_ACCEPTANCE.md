# DESKTOP 01C.3F — Real Windows-native update 0.1.5 V2

Baseline: `3c26daf`

Prepare source/release 0.1.5 while keeping installed FacadeFlow on 0.1.4.

V2 corrections:
- PowerShell launchers contain exactly one UTF-8 BOM for Windows PowerShell 5.1.
- The 0.1.5 verifier checks the actual atomic authorization implementation:
  `authorizePath + '.tmp'` followed by `rename(authorizeTemp, authorizePath)`.
- The WMI/CIM updater implementation itself is unchanged.

Real test after release:
0.1.4 -> detect 0.1.5 -> download -> Update and restart -> independent worker survives -> NSIS /S -> relaunch as 0.1.5.
