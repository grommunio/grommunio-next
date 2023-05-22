import 'tinymce/tinymce';
import 'tinymce/themes/silver';
import 'tinymce/plugins/code';
import 'tinymce/plugins/wordcount';

// Add any additional plugins or themes you need

const getTinyMCEConfig = (darkMode) => {
  return {
    skin: darkMode ? 'oxide-dark' : 'oxide',
    content_css: darkMode ? 'darkmode.css' : 'lightmode.css',
    // Add any other configuration options you need
    plugins: 'code wordcount',
    toolbar: 'undo redo | formatselect | bold italic | code',
  };
};

export default getTinyMCEConfig;
