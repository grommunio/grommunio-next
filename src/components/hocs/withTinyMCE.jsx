import React, { useEffect, useRef } from 'react';
import getTinyMCEConfig from '../tinyMCEConfig';
import * as tinymce from 'tinymce/tinymce';

const withTinyMCE = (WrappedComponent) => {
  return ({ darkMode, ...props }) => {
    const editorRef = useRef(null);

    useEffect(() => {
      const config = getTinyMCEConfig(darkMode);

      // Initialize TinyMCE
      if (editorRef.current) {
        tinymce.init({
          ...config,
          target: editorRef.current,
        });
      }

      // Clean up on component unmount
      return () => {
        tinymce.remove(editorRef.current);
      };
    }, [darkMode]);

    return (
      <div>
        <textarea ref={editorRef} />
        <WrappedComponent {...props} />
      </div>
    );
  };
};

export default withTinyMCE;
