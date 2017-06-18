#类似promise的工具
* 目前具备resolve、reject、complete、all、race，5个功能
* 不同于promise的一点是可以多次resolve，complete之后，便不能再次resolve
* 目前尚未支持链式调用和catch