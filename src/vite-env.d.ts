/// <reference types="vite/client" />

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.wasm?url' {
  const content: string;
  export default content;
}

declare module 'sql.js/dist/sql-asm.js' {
  import initSqlJs from 'sql.js';
  export default initSqlJs;
}
