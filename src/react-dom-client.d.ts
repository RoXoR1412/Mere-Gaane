declare module 'react-dom/client' {
  import * as ReactDOM from 'react-dom';
  
  export const createRoot: (container: Element | DocumentFragment) => {
    render: (element: React.ReactNode) => void;
    unmount: () => void;
  };
  
  export default ReactDOM;
} 