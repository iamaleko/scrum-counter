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
      <div className="assignee__points">BE <b>{points.be}</b> FE <b>{points.fe}</b> QA <b>{points.qa}</b></div>
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

    chrome.runtime.onMessage.addListener((message) => {
      switch (message?.type) {
        case 'CounterCollectedData':
          const assignees = {};

          let hasUnscoredIssues = false,
            hasMixedScores = false,
            hasMiscalculation = false;

          message.data.rows.forEach((row) => {
            if (ignoredTaskTypesSet.has(row.issue.type)) return;

            if (!(row.assignee.name in assignees)) {
              assignees[row.assignee.name] = {
                assignee: row.assignee,
                points: {
                  total: 0,
                  fe: 0,
                  be: 0,
                  qa: 0,
                },
                error: false
              }
            }
            
            assignees[row.assignee.name].points.total += row.points.total;
            assignees[row.assignee.name].points.fe += row.points.fe;
            assignees[row.assignee.name].points.be += row.points.be;
            assignees[row.assignee.name].points.qa += row.points.qa;

            if (row.points.total === 0) {
              setErrorUnscoredIssuesFound(true);
              assignees[row.assignee.name].error = true;
              hasUnscoredIssues = true;
            }

            if (row.points.qa > 0 && row.points.fe + row.points.be > 0) {
              assignees[row.assignee.name].error = true;
              hasMixedScores = true;
            }

            if (
              (row.points.qa + row.points.fe + row.points.be > 0) &&
              row.points.qa + row.points.fe + row.points.be !== row.points.total
            ) {
              assignees[row.assignee.name].error = true;
              hasMiscalculation = true;
            }
          });

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