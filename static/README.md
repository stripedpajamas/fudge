# static

Choo-cli created a directory structure that [we've found to be optimal](https://yoshuawuyts.gitbooks.io/choo/content/guides/designing-for-reusability.html) for slim
applications and reusability.

```txt
assets/        images and fonts, if you have any
elements/      standalone application-specific elements
lib/           generalized components, should be moved out of project later
pages/         views that are directly mounted on the router
stores/        stores that are used in pages and elements
client.js      main application entry; programmatic manifest file
package.json   manifest file
```

You can use choo-cli to generate pieces of your project as you are developing.
For example you can generate

Pages
```bash
$ choo generate page my-page
```

Elements
```bash
$ choo generate element my-element
```

Stores
```bash
$ choo generate store my-store
```

## npm scripts

Choo-cli was made for generating choo projects and code, and leverages npm scripts
for certain project task. So in our project a set of npm scripts have already
been generated that perform various tasks such as testing/serving/building/etc.

At any time you can review the complete list of `npm scripts` available by viewing
[package.json](./package.json) or by running the following command:

```
$ npm run
```

Here is complete list the the commands and their function
- start - start dev server at [localhost:8080](https://localhost:8080)
- build - builds your project to deploy to a server
- test - runs unit tests, for now it will just run linting.
- lint - runs eslint against your code

So for example you can run `npm start` to start a dev server. You can now see your
app running at [localhost:8080](https://localhost:8080)
