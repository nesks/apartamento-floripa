#!/usr/bin/env python3
"""Lê vista_urls.txt, escolhe a pasta dominante por id, e gera JS compacto."""
import collections
import os
import json
import sys

ID_TO_URLS = collections.defaultdict(list)
with open("vista_urls.txt") as f:
    for line in f:
        parts = line.strip().split("\t")
        if len(parts) != 2:
            continue
        ID_TO_URLS[int(parts[0])].append(parts[1])

def folder(url):
    # https://cdn.vistahost.com.br/{acc}/vista.imobi/fotos/{folder}/{file}
    segs = url.split("/")
    return segs[6] if len(segs) > 6 else ""

result = {}
for id_, urls in sorted(ID_TO_URLS.items()):
    by_folder = collections.Counter(folder(u) for u in urls)
    primary = by_folder.most_common(1)[0][0]
    kept = [u for u in urls if folder(u) == primary]
    # ordena por nome do arquivo (preserva ordem natural)
    kept.sort()
    result[id_] = kept
    print(f"id {id_}: {len(kept)} URLs (pasta {primary})", file=sys.stderr)

# compacta usando prefixo comum por id
def common_prefix(strs):
    if not strs: return ""
    s1, s2 = min(strs), max(strs)
    i = 0
    while i < len(s1) and i < len(s2) and s1[i] == s2[i]:
        i += 1
    return s1[:i]

def common_suffix(strs):
    if not strs: return ""
    rev = [s[::-1] for s in strs]
    return common_prefix(rev)[::-1]

VH = "https://cdn.vistahost.com.br/"

out_lines = ["const VH = '" + VH + "';", "function _v(p, s, x){ return s.map(h => VH + p + h + x); }"]
out_lines.append("const FOTOS_REMOTAS = {")
for id_, urls in result.items():
    stripped = [u[len(VH):] for u in urls]
    pre = common_prefix(stripped)
    suf = common_suffix(stripped)
    mids = [s[len(pre):len(s)-len(suf)] for s in stripped]
    # garantir que reconstrói corretamente
    rebuilt = [VH + pre + m + suf for m in mids]
    assert rebuilt == urls, f"mismatch on id {id_}"
    mids_json = json.dumps(mids, separators=(",", ":"))
    out_lines.append(f"  {id_}: _v({json.dumps(pre)},{mids_json},{json.dumps(suf)}),")
out_lines.append("};")

with open("fotos_block.js", "w") as f:
    f.write("\n".join(out_lines) + "\n")
print(f"\nGenerated fotos_block.js ({os.path.getsize('fotos_block.js')} bytes)", file=sys.stderr)
