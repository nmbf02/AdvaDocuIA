Option Explicit
Dim sh, fso, root, node, tsx, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

If WScript.Arguments.Count >= 1 Then
  root = WScript.Arguments(0)
Else
  root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
End If

If WScript.Arguments.Count >= 2 Then
  node = WScript.Arguments(1)
Else
  node = "C:\Program Files\nodejs\node.exe"
End If

tsx = root & "\node_modules\tsx\dist\cli.mjs"
sh.CurrentDirectory = root
cmd = """" & node & """ """ & tsx & """ """ & root & "\server.ts"""
sh.Run cmd, 0, False
