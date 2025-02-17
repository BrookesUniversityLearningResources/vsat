## Version Control

We're using Git and GitHub; here's the GitHub repository:

* https://github.com/BrookesUniversityLearningResources/vsat

The contribution process typically involves:

* pulling `main` to ensure you're up to date
* switching to a new branch where you'll make your changes
* committing those changes [with one or more useful messages](https://cbea.ms/git-commit/)
* pushing your feature branch to GitHub
  * you may wish to rebase from `main` to ensure you're up to date
* [creating a Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) (PR) to merge your feature branch into `main`
  * ensure that [the tests pass](https://github.com/BrookesUniversityLearningResources/vsat/actions)
  * ensure that the linting / formatting is cool
* getting your PR reviewed by [someone else on the team](https://github.com/BrookesUniversityLearningResources/vsat/graphs/contributors)
  * [proactively assign the PR to someone for review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/requesting-a-pull-request-review)
  * you may need to action any review comments
  * you may find the BBC's [guide to helpful code reviews](https://github.com/bbc/simorgh/blob/latest/docs/Code-Reviews.mdx) worth reading
* rebasing / or squashing your branch into `main` once your PR is approved

## Linting / Formatting

We're using [Biome](https://biomejs.dev/) for our formatter and linter.

The `package.json` has two scripts—`format` and `lint`—that you can run to
format and lint the codebase.

### Editor

Use whatever editor / IDE you like so long as any code:

* is formatted per our formatter
* is linted per our linter

If you're using VSCode then install
[the official Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome).

If you're using another editor / IDE then it's on you
[to ensure conformance](https://biomejs.dev/guides/integrate-in-editor/) with
our formatting / linting standards.

