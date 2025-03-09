# [](https://github.com/unplugin/unplugin-vue-jsx-vapor/compare/v1.0.9...v) (2025-03-09)


### Bug Fixes

* **babel:** compatibility with CommonJS ([00744bc](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/00744bcd669830f99af864aa37bb6061ebde294b))
* **babel:** prevent slot errors by excluding conditional expressions ([c8b0171](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/c8b01717545303100eee45710e3b508804ad8ea9))
* build error ([7bea325](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/7bea325bbc8298e63fb80bb88288e1216b14e5f6))
* **compiler:** prevent handle comment node for v-slot ([5919124](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/5919124be144fc0601cd831544e78a0caf736629))
* correct export path for api ([a6ec3a3](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/a6ec3a33aa486220bd317f43b8b1f26afa62eefb))
* lint ([1289392](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/12893921d9f004d31db8f99362ac71a29bebd68e))
* lint ([73c3534](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/73c3534853f5580c5ccee8c5493478b6627fe848))
* lint ([1d08537](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/1d08537f023ae6f4392a1fe1e7d349c1164f79cf))
* lint ([03a7140](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/03a7140b6e89cd34fa6eb746323281e39ede74d4))
* lint ([b9edbb7](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/b9edbb7f2c5e306a71555d13baf27b0246ba6257))
* lint ([1cda436](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/1cda436714faf3f79405771a060f79b3aa4ea804))
* lint ([ba64de1](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/ba64de187f672d9e17f21c4054825f84fa9cfc91))
* lint ([2abc350](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/2abc35088596499343fbd49992dadda727b9fa4b))
* remove any ([abf0d0c](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/abf0d0c6a1ea4991f1627a251163d8a3bc22ef87))
* typecheck ([ecbbbab](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/ecbbbab33145e633561405847efd4bf7cf229c98))
* typecheck ([31787c2](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/31787c2028c53300b5128910d0a8d51e0c41cb27))
* **unplugin:** correct type for raw.ts ([ba206e6](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/ba206e61d66bd73d0fd3c00ef9061c711c592457))
* **unplugin:** typecheck ([ab8cbfe](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/ab8cbfeba1cb4bd2a05f201908c5b2259e223d77))


### Features

* add interop mode ([f46592c](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/f46592c2913d484511d2e067fb079bd3d7a68312))
* **babel:** support nested source maps ([3e69eba](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/3e69eba92a2a5be9a21fc85b6433f1008850d851))
* **babel:** support source map ([17d7ea7](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/17d7ea708c8a313e3811312c348a55b1abce7a6c))
* **compiler:** remove babel/parser ([ac494d1](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/ac494d1ea62ca4f61bc8d0ceee9bc47e1f06e606))
* **compiler:** support native v-if directive ([18b77fc](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/18b77fc49df3a500fafa67ebd69ada729bcb7ab1))
* **compiler:** support native v-slot directive ([9db436d](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/9db436dd04e8e8214c3d179586a3b80f63a52777))
* **compiler:** support nested component slot ([a17e04e](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/a17e04ebb5ecbe8d7b7fd37206ba1fc083351e03))
* **compiler:** support string source ([4293948](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/42939489c6d89d5dce1e7d9c2640ec8c07f3ab44))
* **compiler:** support v-once directive ([16a6b49](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/16a6b49ea976209adfb50abd84d24c5bd4641326))
* **compiler:** support v-text directive ([e1445ae](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/e1445ae907837351fe64419173c1bd10b8e29600))
* introducing babel-plugin ([dd2e384](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/dd2e3840030e3b35b682baa6ea4d84516f7de556))
* support AST node compilation ([06eb0a3](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/06eb0a3a8e8247a1c9c93113a958dd1cdd1cf47b))
* **unplugin:** add filename option for source map ([10a6909](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/10a69095e16f642993eee760d5b44f7d6f0b658f))
* **unplugin:** add volar plugin ([7bf1284](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/7bf1284468483f3567aad6466d363ae2928d6a6c))
* **unplugin:** expose raw to support browser environments ([4dc2ffc](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/4dc2ffcce47f888cfb6f9f66ef1b2863401b606d))


### Reverts

* **unplugin:** add effectScope for helper code ([dfb640b](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/dfb640b30c59ee0103a84e73f40ba803a25050e9))
* vue/vapor ([ea9f738](https://github.com/unplugin/unplugin-vue-jsx-vapor/commit/ea9f738f6ce1a580d14c0518df29d8cae1041434))



