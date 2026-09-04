// ESLint Flat Config（ESLint 9）
// 基于 Expo 官方规则（eslint-config-expo），并关闭与 Prettier 冲突的格式规则
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
]);
