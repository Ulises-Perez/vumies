"""
Parser para el payload de datos que SvelteKit embebe en el HTML de animeav1.com.

El sitio renderiza en el servidor (SSR) e incrusta TODO el estado de la página
como un literal de objeto JavaScript dentro de un <script>:

    __sveltekit_xxx = { ..., data: [null, {type:"data", data:{...}}, ...] }

Estos literales NO son JSON válido (claves sin comillas, `void 0`, `undefined`,
etc.), así que usamos un parser de descenso recursivo propio en lugar de json.loads.
Este es el equivalente en Python del enfoque axios + vm del repo original.
"""


class _JSParser:
    def __init__(self, text: str, pos: int = 0):
        self.s = text
        self.i = pos
        self.n = len(text)

    def _skip_ws(self):
        while self.i < self.n and self.s[self.i] in " \t\r\n":
            self.i += 1

    def parse_value(self):
        self._skip_ws()
        if self.i >= self.n:
            return None
        c = self.s[self.i]
        if c == "{":
            return self._parse_object()
        if c == "[":
            return self._parse_array()
        if c in "\"'`":
            return self._parse_string()
        return self._parse_literal()

    def _parse_object(self):
        obj = {}
        self.i += 1  # {
        self._skip_ws()
        if self.i < self.n and self.s[self.i] == "}":
            self.i += 1
            return obj
        while self.i < self.n:
            guard = self.i
            self._skip_ws()
            # key
            c = self.s[self.i]
            if c in "\"'`":
                key = self._parse_string()
            else:
                key = self._parse_identifier()
            self._skip_ws()
            if self.i < self.n and self.s[self.i] == ":":
                self.i += 1  # ':'
            value = self.parse_value()
            obj[key] = value
            self._skip_ws()
            if self.i >= self.n:
                break
            if self.s[self.i] == ",":
                self.i += 1
                self._skip_ws()
                if self.i < self.n and self.s[self.i] == "}":  # trailing comma
                    self.i += 1
                    return obj
                continue
            if self.s[self.i] == "}":
                self.i += 1
                return obj
            # Sin progreso: evitar bucle infinito
            if self.i <= guard:
                self.i += 1
        return obj

    def _parse_array(self):
        arr = []
        self.i += 1  # [
        self._skip_ws()
        if self.i < self.n and self.s[self.i] == "]":
            self.i += 1
            return arr
        while self.i < self.n:
            guard = self.i
            self._skip_ws()
            arr.append(self.parse_value())
            self._skip_ws()
            if self.i >= self.n:
                break
            if self.s[self.i] == ",":
                self.i += 1
                self._skip_ws()
                if self.i < self.n and self.s[self.i] == "]":  # trailing comma
                    self.i += 1
                    return arr
                continue
            if self.s[self.i] == "]":
                self.i += 1
                return arr
            # Sin progreso: evitar bucle infinito
            if self.i <= guard:
                self.i += 1
        return arr

    def _parse_string(self):
        quote = self.s[self.i]
        self.i += 1
        out = []
        while self.i < self.n:
            c = self.s[self.i]
            if c == "\\":
                nxt = self.s[self.i + 1]
                mapping = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f",
                           '"': '"', "'": "'", "`": "`", "\\": "\\", "/": "/", "0": "\0"}
                if nxt == "u":
                    hexcode = self.s[self.i + 2:self.i + 6]
                    out.append(chr(int(hexcode, 16)))
                    self.i += 6
                    continue
                out.append(mapping.get(nxt, nxt))
                self.i += 2
                continue
            if c == quote:
                self.i += 1
                return "".join(out)
            out.append(c)
            self.i += 1
        return "".join(out)

    def _parse_identifier(self):
        start = self.i
        while self.i < self.n and (self.s[self.i].isalnum() or self.s[self.i] in "_$"):
            self.i += 1
        return self.s[start:self.i]

    def _parse_literal(self):
        # void 0, undefined, null, true, false, NaN, Infinity, numbers
        if self.s.startswith("void", self.i):
            self.i += 4
            self._skip_ws()
            # consume the operand (e.g. "0")
            while self.i < self.n and self.s[self.i] not in ",}]":
                self.i += 1
            return None
        for word, val in (("undefined", None), ("null", None),
                          ("true", True), ("false", False),
                          ("NaN", None), ("Infinity", None)):
            if self.s.startswith(word, self.i):
                self.i += len(word)
                return val
        # number
        start = self.i
        while self.i < self.n and self.s[self.i] in "+-0123456789.eExX":
            self.i += 1
        raw = self.s[start:self.i]
        if not raw:
            # Carácter inesperado: avanzar para no estancarse
            self.i += 1
            return None
        try:
            if any(ch in raw for ch in ".eE") and "x" not in raw.lower():
                return float(raw)
            return int(raw, 0) if raw.lower().startswith("0x") else int(raw)
        except ValueError:
            return raw


def _extract_balanced(text: str, start: int) -> str:
    """Devuelve la sección balanceada [..] o {..} comenzando en `start`."""
    open_char = text[start]
    close_char = "]" if open_char == "[" else "}"
    depth = 0
    quote = ""
    escaped = False
    for i in range(start, len(text)):
        ch = text[i]
        if quote:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == quote:
                quote = ""
            continue
        if ch in "\"'`":
            quote = ch
            continue
        if ch == open_char:
            depth += 1
        elif ch == close_char:
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return text[start:]


def extract_sveltekit_data(html: str):
    """Extrae y parsea el array `data` del payload SvelteKit. Devuelve list o None."""
    marker = html.find("__sveltekit_")
    while marker != -1:
        data_idx = html.find("data:", marker)
        if data_idx == -1:
            return None
        bracket = html.find("[", data_idx)
        brace = html.find("{", data_idx)
        # Elegir el delimitador de apertura más cercano
        if bracket == -1:
            start = brace
        elif brace == -1:
            start = bracket
        else:
            start = min(bracket, brace)
        if start == -1:
            return None
        literal = _extract_balanced(html, start)
        try:
            parsed = _JSParser(literal).parse_value()
            if isinstance(parsed, list) and parsed:
                return parsed
        except Exception:
            pass
        marker = html.find("__sveltekit_", marker + 12)
    return None


def walk(node, visitor, seen=None):
    """Recorre recursivamente dicts/lists llamando visitor(node) en cada nodo."""
    if seen is None:
        seen = set()
    if not isinstance(node, (dict, list)):
        return
    nid = id(node)
    if nid in seen:
        return
    seen.add(nid)
    visitor(node)
    children = node.values() if isinstance(node, dict) else node
    for child in children:
        walk(child, visitor, seen)


def collect_by_key(root, key_name):
    """Devuelve todos los valores asociados a `key_name` en cualquier nivel."""
    found = []

    def visit(node):
        if isinstance(node, dict) and key_name in node:
            found.append(node[key_name])

    walk(root, visit)
    return found


def first_object_by_key(root, key_name):
    for value in collect_by_key(root, key_name):
        if isinstance(value, dict):
            return value
    return None
