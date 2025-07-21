import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "/src/css/panel.css";

function Assignee({ assignee, points, error }) {
  let className = "";
  if (points.total >= Number(import.meta.env.VITE_JIRA_SP_NORMAL)) className = "assignee__points-total--ok";
  if (points.total >= Number(import.meta.env.VITE_JIRA_SP_TOO_MUCH)) className = "assignee__points-total--too-much";
  if (points.total >= Number(import.meta.env.VITE_JIRA_SP_WAY_TOO_MUCH)) className = "assignee__points-total--way-too-much";

  return (
    <li key={assignee.name} className={"assignee" + (error ? " assignee--error" : "")}>
      <img className="assignee__avatar" src={assignee.avatar} alt={assignee.name}/>
      <div className="assignee__name">{assignee.name}</div>
      <div className="assignee__points">
        {
          Object.keys(points.groups)
            .filter((group) => points.groups[group] > 0)
            .map((group) => (
              <> {group.toUpperCase()} <b>{points.groups[group]}</b></>
            ))
        }
      </div>
      <div className={"assignee__points-total " + className}>{points.total}</div>
    </li>
  )
}

function AssigneeDummy() {
  return (
    <li className="assignees__dummy">
      <div>Nothing to count</div>
      The planned sprint<br/>has not yet been created<br/>or is still empty
    </li>
  )
}

function Error({ isOccurred, text }) {
  return (
    isOccurred && <div className="error">{text}</div>
  )
}

function Panel() {
  const [assignees, setAssignees] = useState([]);
  const [errorUnscoredIssuesFound, setErrorUnscoredIssuesFound] = useState(false);
  const [errorMixedScoresFound, setErrorMixedScoresFound] = useState(false);
  const [errorMiscalculationFound, setErrorMiscalculationFound] = useState(false);

  const ignoredTaskTypesSet = new Set(String(import.meta.env.VITE_JIRA_TASK_IGNORE_TYPES).split(','));

  useEffect(() => {
    let port = chrome.runtime.connect({ name: "panel" });
    port.onDisconnect.addListener(() => {
      port = chrome.runtime.connect({ name: "panel" });
    });

    const mixins = (import.meta.env.VITE_JIRA_SP_MIXINS || '').split('|').map((s) => s.split(','));

    chrome.runtime.onMessage.addListener((message) => {
      switch (message?.type) {
        case 'CounterCollectedData':
          const assignees = {};

          message.data.rows.forEach((row) => {
            if (ignoredTaskTypesSet.has(row.issue.type)) return;

            if (!(row.assignee.name in assignees)) {
              assignees[row.assignee.name] = {
                assignee: row.assignee,
                points: {
                  total: 0,
                  groups: {},
                },
                error: false
              }
            }
            
            assignees[row.assignee.name].points.total += row.points.total;
            for (const group in row.points.groups) {
              if (!(group in assignees[row.assignee.name].points.groups)) {
                assignees[row.assignee.name].points.groups[group] = 0;
              }
              assignees[row.assignee.name].points.groups[group] += Number(row.points.groups[group]);
            }
          });

          let hasUnscoredIssues = false,
            hasMixedScores = false,
            hasMiscalculation = false;

          for (const name in assignees) {
            const assignee = assignees[name];
            if (assignee.points.total === 0) {
              setErrorUnscoredIssuesFound(true);
              assignee.error = true;
              hasUnscoredIssues = true;
            }
            
            const totalSum = Object.values(assignee.points.groups).reduce((a, v) => a + v, 0);
            if (mixins.length && totalSum) {
              let found = false;
              for (const mixin of mixins) {
                const mixinSum = mixin.reduce((a, group) => a + assignee.points.groups[group], 0);
                if (mixinSum === totalSum) {
                  found = true;
                  break;
                }
              }
              if (!found) {
                assignee.error = true;
                hasMixedScores = true;
              }
            }

            if (totalSum > 0 && totalSum !== assignee.points.total) {
              assignee.error = true;
              hasMiscalculation = true;
            }
          }

          setErrorUnscoredIssuesFound(hasUnscoredIssues);
          setErrorMixedScoresFound(hasMixedScores);
          setErrorMiscalculationFound(hasMiscalculation);

          const rows = Object.values(assignees);
          rows.sort((a, b) => a.assignee.name > b.assignee.name ? 1 : -1);
          setAssignees(rows);
          break;
      }
    });
  }, []);

  return (<>
    <Error isOccurred={errorUnscoredIssuesFound} text="Unscored issues found!"/>
    <Error isOccurred={errorMixedScoresFound} text="Mixed scores found!"/>
    <Error isOccurred={errorMiscalculationFound} text="Miscalculation found!"/>
    <ul className="assignees">
      { assignees.length ? assignees.map(assignee => <Assignee {...assignee}/>) : <AssigneeDummy/> }
    </ul>
  </>)
}

createRoot(document.body).render(<Panel />);