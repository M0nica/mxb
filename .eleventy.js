require('dotenv').config()

const pluginRss = require('@11ty/eleventy-plugin-rss')
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const htmlmin = require('html-minifier')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')

const filters = require('./_eleventy/filters.js')
const shortcodes = require('./_eleventy/shortcodes.js')
const isProduction = process.env.NODE_ENV === 'production'
const globs = {
    posts: 'src/posts/**/*.md',
    drafts: 'src/drafts/**/*.md',
    notes: 'src/notes/*.md'
}

const anchorSlugify = (s) =>
    encodeURIComponent(
        'h-' +
            String(s)
                .trim()
                .toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=_`~()]/g, '')
                .replace(/\s+/g, '-')
    )

module.exports = function (config) {
    // Filters
    Object.keys(filters).forEach((filterName) => {
        config.addFilter(filterName, filters[filterName])
    })

    // Shortcodes
    config.addShortcode('icon', shortcodes.icon)
    config.addPairedShortcode('signup', shortcodes.signup)
    config.addPairedShortcode('callout', shortcodes.callout)

    // Plugins
    config.addPlugin(pluginRss)
    config.addPlugin(pluginSyntaxHighlight)

    // Layouts
    config.addLayoutAlias('base', 'base.njk')
    config.addLayoutAlias('page', 'page.njk')
    config.addLayoutAlias('post', 'post.njk')
    config.addLayoutAlias('note', 'note.njk')

    // Pass-through files
    config.addPassthroughCopy('src/site.webmanifest')
    config.addPassthroughCopy('src/keybase.txt')
    config.addPassthroughCopy('src/robots.txt')
    config.addPassthroughCopy('src/favicon.ico')
    config.addPassthroughCopy('src/assets/images')
    config.addPassthroughCopy('src/assets/fonts')

    // Markdown Parsing
    config.setLibrary(
        'md',
        markdownIt({
            html: true,
            breaks: true,
            typographer: true
        }).use(markdownItAnchor, {
            permalink: true,
            permalinkSymbol: '#',
            permalinkClass: 'heading-anchor',
            permalinkBefore: true,
            level: 2,
            slugify: anchorSlugify
        })
    )

    // Collections: Navigation
    config.addCollection('nav', function (collection) {
        return collection.getFilteredByTag('nav').sort(function (a, b) {
            return a.data.navorder - b.data.navorder
        })
    })

    // Collections: Posts
    config.addCollection('posts', function (collection) {
        return collection
            .getFilteredByGlob([globs.posts, globs.drafts])
            .filter((item) => item.data.permalink !== false)
            .filter((item) => !(item.data.draft && isProduction))
    })

    // Collections: Featured Posts
    config.addCollection('featured', function (collection) {
        return collection
            .getFilteredByGlob(globs.posts)
            .filter((item) => item.data.featured)
            .sort((a, b) => b.date - a.date)
    })

    // Collections: Notes
    config.addCollection('notes', function (collection) {
        return collection.getFilteredByGlob(globs.notes).reverse()
    })

    // Minify HTML Output
    config.addTransform('htmlmin', function (content, outputPath) {
        if (outputPath && outputPath.endsWith('.html') && isProduction) {
            return htmlmin.minify(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true
            })
        }
        return content
    })

    // opt out of using gitignore for eleventy,
    // because the drafts folder is ignored, but should still be processed.
    config.setUseGitIgnore(false)

    // Base Config
    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts',
            data: 'data'
        },
        templateFormats: ['njk', 'md'],
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk',
        passthroughFileCopy: true
    }
}
