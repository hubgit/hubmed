<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  exclude-result-prefixes="xlink">

  <xsl:output encoding="utf-8" indent="yes" method="xml" omit-xml-declaration="yes" standalone="no"/>

  <xsl:template match="PubmedArticleSet">
    <div class="collection">
      <xsl:apply-templates select="PubmedArticle"/>
    </div>
  </xsl:template>

  <xsl:template match="PubmedArticle">
    <article>
      <xsl:apply-templates select="PubmedData/ArticleIdList/ArticleId"/>
      <xsl:apply-templates select="MedlineCitation/Article"/>
    </article>
  </xsl:template>

  <xsl:template match="Article">
      <xsl:apply-templates select="ArticleTitle"/>
      <xsl:apply-templates select="AuthorList/Author"/>
      <xsl:apply-templates select="Journal"/>
      <xsl:apply-templates select="Pagination"/>
      <xsl:apply-templates select="Abstract/AbstractText"/>
  </xsl:template>

  <xsl:template match="ArticleTitle">
    <span property="title">
      <xsl:apply-templates select="node()"/>
    </span>
  </xsl:template>

  <xsl:template match="Author">
    <div property="creator" class="multiple">
      <xsl:apply-templates select="ForeName"/>
      <xsl:text> </xsl:text>
      <!--<xsl:apply-templates select="Initials"/>
      <xsl:text> </xsl:text>-->
      <xsl:apply-templates select="LastName"/>
    </div>
  </xsl:template>

  <xsl:template match="ForeName">
    <span property="forename"><xsl:value-of select="."/></span>
  </xsl:template>

  <xsl:template match="LastName">
    <span property="lastname"><xsl:value-of select="."/></span>
  </xsl:template>

  <xsl:template match="Initials">
    <span property="initials"><xsl:value-of select="."/></span>
  </xsl:template>

  <xsl:template match="Name">
    <span property="name"><xsl:value-of select="."/></span>
  </xsl:template>

  <xsl:template match="AbstractText">
    <div property="abstract"><xsl:apply-templates select="node()"/></div>
  </xsl:template>

  <xsl:template match="PubDate" mode="journal">
    <abbr property="datePublished">
      <xsl:value-of select="Year"/>
      <xsl:text> </xsl:text>
      <xsl:value-of select="Month"/>
      <xsl:text> </xsl:text>
      <xsl:value-of select="Day"/>
    </abbr>;
  </xsl:template>

  <xsl:template match="Pagination">
      <xsl:apply-templates select="MedlinePgn"/>
  </xsl:template>

  <xsl:template match="MedlinePgn">
    <div property="pagination"><xsl:value-of select="."/></div>
  </xsl:template>

  <xsl:template match="Journal">
    <xsl:apply-templates select="ISSN" mode="journal"/>
    <xsl:apply-templates select="Title" mode="journal"/>
    <xsl:apply-templates select="ISOAbbreviation" mode="journal"/>
    <xsl:apply-templates select="JournalIssue/PubDate" mode="journal"/>
    <xsl:apply-templates select="JournalIssue/Volume" mode="journal"/>
    <xsl:apply-templates select="JournalIssue/Issue" mode="journal"/>
  </xsl:template>

  <xsl:template match="ISSN" mode="journal">
    <div property="journalISSN"><xsl:value-of select="."/></div>
  </xsl:template>

  <xsl:template match="Title" mode="journal">
    <div property="journalTitle"><xsl:value-of select="."/></div>
  </xsl:template>

  <xsl:template match="ISOAbbreviation" mode="journal">
    <div property="journalISOAbbreviation"><xsl:value-of select="."/></div>
  </xsl:template>

  <xsl:template match="Volume" mode="journal">
    <div property="volume"><xsl:value-of select="."/></div>
  </xsl:template>

  <xsl:template match="Issue" mode="journal">
    <div property="issue"><xsl:value-of select="."/></div>
  </xsl:template>

  <xsl:template match="ArticleId[@IdType='pubmed']">
    <div property="pmid"><xsl:value-of select="."/></div>
  </xsl:template>

  <xsl:template match="ArticleId[@IdType='doi']">
    <div property="doi"><xsl:value-of select="."/></div>
  </xsl:template>

  <xsl:template match="*">
      <xsl:copy-of select="."/>
  </xsl:template>
</xsl:stylesheet>