const text = {
  common: {
    loading: {
      en: "Loading...",
      fr: "Chargement...",
    },
    totalRisk: {
      en: "Total Risk",
      fr: "Risque Total",
    },
  },
  header: {
    layout: {
      l1: {
        en: "Nationwide overview",
        fr: "Aperçu national",
      },
      l2: {
        en: "Detailed analysis",
        fr: "Analyse détaillée",
      },
      label: {
        en: "Analysis mode",
        fr: "Mode d'analyse",  
      }
    },
    year: {
      label: {
        en: "Selected time",
        fr: "Horizon sélectionné",
      },
    },
  },
  panels: {
    tree: {
      en: "Risk Customization Tree",
      fr: "Personnalisation du risque",
      tooltip: {
        en: "This tree shows how total risk is built up from the four determinants (Hazard, Vulnerability, Exposure and Response) and their indicators, as described by the IPCC. Each determinant is calculated as a sum of its indicators, normalized from 0 to 100. The total risk is the sum of the determinants, normalised.",
        fr: "Cet arbre montre comment le risque global est construit à partir de quatre déterminants (Aléa, Vulnérabilité, Exposition and Réponse) et de leurs indicateurs, comme décrit par le GIEC. Chaque déterminant est calculé comme la somme de ses indicateurs, normalisée de 0 à 100. Le risque global est la somme des déterminants, normalisée.",
      },
    },
    map: {
      en: "Map View",
      fr: "Vue Cartographique",
      tooltip: {
        en: "This map shows the selected climate risk metric for all municipalities/intermunicipalities/departments in France. The colors represent the relative values of the currently selected metric, where stronger colors indicate higher values.",
        fr: "Ce carte montre la métrique de risque climatique sélectionnée pour toutes les communes/EPCI/departments en France. Les couleurs représentent les valeurs relatives de la métrique actuellement sélectionnée, où les couleurs plus fortes indiquent des valeurs plus élevées.",
      },
    },
    chart: {
      en: "Distribution Chart",
      fr: "Diagramme de Distribution",
      tooltip: {
        en: "This chart shows the distribution of the chosen metric accross all municipalities/intermunicipalities/departments in the nation and in its department (green line). By hovering over the chart, you can see the number of entity that have a value within the hovered bin. Above the chart, you can change the metric that is shown in the chart.",
        fr: "Ce diagramme montre la distribution de la métrique choisie parmi toutes les communes/EPCI/departments du pays et au sein du département de la commune sélectionnée. En survolant le diagramme, vous pouvez voir le nombre d'entités ayant la valeur survolée. Au-dessus du diagramme, vous pouvez changer la métrique affichée.",
      },
    },
    table: {
      en: "Data Table",
      fr: "Tableau de Données",
      tooltip: {
        en: "This table displays the values associated with municipalities and the mean of the municipalities within intermunicipalities and departments. The values ​are normalized from 0 to 100. Detailed indicators are available in 'Municipality Analysis' mode.",
        fr: "Ce tableau présente les valeurs associées aux communes et la moyenne des valeurs des municipalitiés au sein des EPCI et départements sélectionnée. Les valeurs  sont normalisées de 0 à 100. Le détail des indicateurs est disponible en mode 'Analyse de la commune'.",
      },
    },
    details: {
      en: "Ranking",
      fr: "Classement",
      tooltip: {
        en: "This panel shows the selected municipalities/intermunicipalities/departments' rankings for all determinants and indicators in comparison to the other entities in the nation and their department. A ranking of 1 means the entity has the highest climate risk for that metric within the selected group, so lower ranking numbers indicate higher relative risk. The determinants are sorted by their contribution to the total risk, while the indicators within each determinant are sorted by their contribution to that determinant.",
        fr: "Ce paneau affiche les classements de la commune/EPCI/département sélectionnée pour tous les déterminants et indicateurs par rapport aux autres entités de France et de son département. Un classement de 1 signifie que la commune a le risque climatique le plus élevé pour ce indicateur au sein du groupe sélectionné, ainsi, des numéros de classement plus bas indiquent un risque relatif plus élevé. Les déterminants sont triés par leur contribution au risque total, tandis que les indicateurs au sein de chaque déterminant sont triés par leur contribution à ce déterminant.",
      },
    },
  },
  chart: {
    tooltip: {
      value: {
        en: "Value",
        fr: "Valeur",
      },
      norway: {
        en: "France",
        fr: "France ",
      },
      county: {
        en: "Department",
        fr: "Département ",
      },
      kommuner: {
        en: "municipalities",
        fr: "communes",
      },
      interval: {
        en: "Interval",
        fr: "Intervalle ",
      },
    },
    stats: {
      mean: {
        en: "Mean",
        fr: "Moyenne",
      },
      median: {
        en: "Median",
        fr: "Médiane",
      },
      tooltip: {
        norge: {
          en: "This column shows the mean and median value of all municipalities/intermunicipalities/departments in the nation.",
          fr: "Cette colonne affiche la moyenne et la médiane de toutes les communes/EPCI/départements dans le pays.",
        },
        fylke: {
          en: "This column shows the mean and median value of all municipalities/intermunicipalities/departments in the selected entity's department.",
          fr: "Cette colonne affiche la moyenne et la médiane de toutes les communes/EPCI/départements dans le département de l'entité sélectionnée.",
        },
      },
    },
  },
  table: {
    kommune: {
      en: "Municipality",
      fr: "Commune",
    },
    departement: {
      en: "Department",
      fr: "Département",
    },
    level: {
      en: "Level:",
      fr: "Niveau :",
    },
    communes: {
      en: "Municipalities",
      fr: "Communes",
    },
    departements: {
      en: "Departments",
      fr: "Départements",
    },
    risk: {
      en: "Risk",
      fr: "Risque",
    },
  },
  details: {
    selectSomething: {
      en: "Select a municipality.",
      fr: "Sélectionnez une commune.",
    },
    tooltip: {
      norge: {
        en: "The number represents the selected municipalities/intermunicipalities/departments' placement among all entities in the nation. Ranking number 1 means the selected entity is the worst, with no other having a worse value.",
        fr: "Le nombre représente la position de l'entité sélectionnée parmi toutes les communes/EPCI/départements dans le pays. Un classement de 1 signifie que l'entité sélectionnée est la plus mauvaise, sans autres entités ayant une valeur plus mauvaise.",
      },
      fylke: {
        en: "The number represents the selected municipalities/intermunicipalities/departments' placement among all entities in its own department. Ranking number 1 means the selected entity is the worst in its department, with no other entities in the department having a worse value.",
        fr: "Le nombre représente la position de l'entité sélectionnée parmi toutes les communes/EPCI/départements dans le département de l'entité sélectionnée. Un classement de 1 signifie que l'entité sélectionnée est la plus mauvaise dans son département, sans autres entités dans le département ayant une valeur plus mauvaise.",
      },
    },
    generateReport: {
      en: "Generate Report",
      fr: "Générer un rapport",
    },
  },
  report: {
    title: {
      en: "Climate risk report",
      fr: "Rapport de risque climatique",
    },
    viewer: {
      generating: {
        en: "Generating report...",
        fr: "Génération du rapport...",
      },
      error: {
        en: "Could not generate report.",
        fr: "Impossible de générer le rapport.",
      },
    },
    selectMunicipality: {
      en: "Select municipality",
      fr: "Sélectionner une commune",
    },
    selectMunicipalityDescription: {
      en: "Select the municipality you want to generate a report for.",
      fr: "Sélectionnez la commune pour laquelle vous souhaitez générer un rapport.",
    },
    selectYear: {
      en: "Select time period",
      fr: "Sélectionner une période temporelle",
    },
    selectYearDescription: {
      en: "Select the time period you want to generate a report for.",
      fr: "Sélectionnez la période temporelle pour laquelle vous souhaitez générer un rapport.",
    },
    download: {
      download: {
        en: "Download report",
        fr: "Télécharger le rapport",
      },
      generating: {
        en: "Generating report",
        fr: "Génération du rapport",
      },
      fileName: {
        en: "municipality-climate-risk-report.pdf",
        fr: "rapport-de-risque-climatique-de-la-commune.pdf",
      },
    },
    document: {
      urlLabel: {
        en: "Detailed description:",
        fr: "Description détaillée:",
      },
      score: {
        en: "Score:",
        fr: "Note:",
      },
      ranked: {
        p1: {
          en: "Ranked",
          fr: "Classé",
        },
        p2: {
          en: "out of",
          fr: "sur",
        },
        p3: {
          en: "municipalities in",
          fr: "communes dans",
        },
        norge: {
          en: "France",
          fr: "France",
        },
        fylke: {
          en: "its department",
          fr: "son département",
        },
        p4: {
          en: "(1 = highest climate risk)",
          fr: "(1 = risque climatique le plus élevé)",
        },
      },
      titlePage: {
        chosenKommune: {
          en: "Selected municipality:",
          fr: "Commune sélectionnée:",
        },
        chosenYear: {
          en: "Selected time period:",
          fr: "Période temporelle sélectionnée:",
        },
      },
      undefinedIndicator: {
        en: "The municipality has not received a score for this indicator.",
        fr: "La commune n'a pas reçu de note pour cet indicateur.",
      },
      documentationPage: {
        title: {
          en: "Documentation",
          fr: "Documentation",
        },
      },
      interpretationTitle: {
        en: "Interpretation of the indicators",
        fr: "Interprétation des indicateurs",
      },
      interpretationText: {
        en: "The risk indicators presented in this document are evaluated relative to the scale of all municipalities in France. They allow you to situate this territory at the national level and do not constitute an absolute measure of local impacts. You can find the detailed methodology behind the development of the indicators at this address: https://www.vestforsk.no/nn/publication/development-comprehensive-climate-risk-ranking-french-municipalities.",
        fr: "Les indicateurs de risque présentés dans ce document sont évalués de manière relative à l'échelle de l'ensemble des communes de France. Ils permettent de situer ce territoire au niveau national et ne constituent pas une mesure absolue des impacts locaux. Vous pouvez trouver la  métholodogie détaillée derrière l'élaboration des indicateurs à cette adresse : https://www.vestforsk.no/nn/publication/development-comprehensive-climate-risk-ranking-french-municipalities.",
      },
    },  
  },
} as const;

export default text;