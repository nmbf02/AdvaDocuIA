Option Explicit
Dim sh, root, node, tsx, cmd
root = "C:\AdvaDocuIA"
node = "C:\Program Files\nodejs\node.exe"
tsx = root & "\node_modules\tsx\dist\cli.mjs"
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = root
cmd = """" & node & """ """ & tsx & """ """ & root & "\server.ts"""
sh.Run cmd, 0, False
