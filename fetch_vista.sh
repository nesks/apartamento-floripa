#!/usr/bin/env bash
set -e
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

declare -a LINKS=(
  "1|https://imoveis.novovista.com.br/?v2=a2V5PTkzZDAwYjU2ZmJiZThmOWZjODYxNTgzZWM5NjgxNDAxJmNvZD0yNTQxJmQ9NjQmY3M9MiZtYXBhPU5hbyZiYWlycm9fY29tZXJjaWFsPVNpbSZsb2dpbj1uYW8mc3RhdHVzPVZlbmRhJnB1cnBvc2U9JTVCJTIydmVuZGElMjIlNUQmY29kX2VtPTIyMDU0"
  "2|https://penseimoveisfloripa.com.br/imovel/ita2915/"
  "3|https://imoveis.novovista.com.br/?v2=a2V5PTZiYzc3N2IwMTRlNTRhNTY4ZmJjOWM4OTZiNzFmZmMwJmNvZD0xOTYwMzI1JmQ9NjU3JmNzPTEmbWFwYT1OYW8mYmFpcnJvX2NvbWVyY2lhbD1OYW8mbG9naW49bmFvJnN0YXR1cz1WZW5kYSZwdXJwb3NlPSU1QiUyMnZlbmRhJTIyJTVEJmNvZF9lbT0xODEyMg"
  "4|https://f1ciaimobiliaria.com.br/imoveis/venda-apartamento-green-village-residence-de-3-quartos-no-bairro-itacorubi-florianopolis-1957252/"
  "6|https://penseimoveisfloripa.com.br/imovel/ita2403/"
  "9|https://imoveis.novovista.com.br/?v2=a2V5PTkzZDAwYjU2ZmJiZThmOWZjODYxNTgzZWM5NjgxNDAxJmNvZD1JVEEzMDAwJmQ9NjQmY3M9MiZtYXBhPU5hbyZiYWlycm9fY29tZXJjaWFsPVNpbSZsb2dpbj1uYW8mc3RhdHVzPVZlbmRhJnB1cnBvc2U9JTVCJTIydmVuZGElMjIlNUQmY29kX2VtPTI5NTM3"
  "12|https://imoveis.novovista.com.br/?v2=a2V5PTUyOTgxZmZjZjdlNzNmMDI5MjQ5MjRmYmZlMjBlNDc4JmNvZD1STVgzMTA2JmQ9MTEmY3M9MSZtYXBhPVNpbSZiYWlycm9fY29tZXJjaWFsPU5hbyZsb2dpbj1uYW8mc3RhdHVzPVZlbmRhJnB1cnBvc2U9JTVCJTIydmVuZGElMjIlNUQmY29kX2VtPTE1NzY5"
  "13|https://imoveis.novovista.com.br/?v2=a2V5PTkzZDAwYjU2ZmJiZThmOWZjODYxNTgzZWM5NjgxNDAxJmNvZD0xOTc2JmQ9NjQmY3M9MiZtYXBhPU5hbyZiYWlycm9fY29tZXJjaWFsPVNpbSZsb2dpbj1uYW8mc3RhdHVzPVZlbmRhJnB1cnBvc2U9JTVCJTIydmVuZGElMjIlNUQmY29kX2VtPTI5NTM3"
  "14|https://imoveis.novovista.com.br/?v2=a2V5PTkzZDAwYjU2ZmJiZThmOWZjODYxNTgzZWM5NjgxNDAxJmNvZD0yMTg2JmQ9NjQmY3M9MiZtYXBhPU5hbyZiYWlycm9fY29tZXJjaWFsPVNpbSZsb2dpbj1uYW8mc3RhdHVzPVZlbmRhJnB1cnBvc2U9JTVCJTIydmVuZGElMjIlNUQmY29kX2VtPTI5NTM3"
  "16|https://imoveis.novovista.com.br/?v2=a2V5PTkzZDAwYjU2ZmJiZThmOWZjODYxNTgzZWM5NjgxNDAxJmNvZD1JVEEyNTcwJmQ9NjQmY3M9MiZtYXBhPU5hbyZiYWlycm9fY29tZXJjaWFsPVNpbSZsb2dpbj1uYW8mc3RhdHVzPVZlbmRhJnB1cnBvc2U9JTVCJTIydmVuZGElMjIlNUQmY29kX2VtPTI5NTM3"
  "17|https://penseimoveisfloripa.com.br/imovel/ita2672/"
  "22|https://imoveis.novovista.com.br/?v2=a2V5PTkzZDAwYjU2ZmJiZThmOWZjODYxNTgzZWM5NjgxNDAxJmNvZD1JVEEyNjc3JmQ9NjQmY3M9MiZtYXBhPU5hbyZiYWlycm9fY29tZXJjaWFsPVNpbSZsb2dpbj1uYW8mc3RhdHVzPVZlbmRhJnB1cnBvc2U9JTVCJTIydmVuZGElMjIlNUQmY29kX2VtPTI5NTM3"
  "24|https://imoveis.novovista.com.br/?v2=a2V5PTZiYzc3N2IwMTRlNTRhNTY4ZmJjOWM4OTZiNzFmZmMwJmNvZD0xOTU5MzA4JmQ9NjU3JmNzPTEmbWFwYT1OYW8mYmFpcnJvX2NvbWVyY2lhbD1OYW8mbG9naW49bmFvJnN0YXR1cz1WZW5kYSZwdXJwb3NlPSU1QiUyMnZlbmRhJTIyJTVEJmNvZF9lbT0xODEyMg"
)

> vista_urls.txt
for item in "${LINKS[@]}"; do
  id="${item%%|*}"
  url="${item#*|}"
  echo "[id $id]" >&2
  curl -s -A "$UA" "$url" \
    | grep -oE 'https?://cdn\.vistahost\.com\.br/[^"'\'' )<>]+\.(jpg|jpeg|png|webp)' \
    | grep -viE '_p\.jpg$|/ibl_' \
    | sort -u \
    | sed "s|^|$id\t|" >> vista_urls.txt
done
wc -l vista_urls.txt
