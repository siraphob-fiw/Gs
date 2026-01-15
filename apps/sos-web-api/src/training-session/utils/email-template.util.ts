/**
 * Utility for generating email templates for training sessions
 */
export class EmailTemplateUtil {
  /**
   * Generate HTML email template for training session exercises
   */
  static generateExerciseEmailHtml(exercises: any[]): string {
    const exerciseHtml = exercises
      .sort((a, b) => {
        const dateA = new Date(a.exercise_date).getTime();
        const dateB = new Date(b.exercise_date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.order ?? 0) - (b.order ?? 0);
      })
      .map((exercise) => {
        const formattedDate = new Date(exercise.exercise_date).toLocaleString(
          'en-US',
          {
            weekday: 'short',
            day: '2-digit',
            year: '2-digit',
            month: 'short',
          },
        );

        // Parse target/modifiers if needed
        let targetArr;
        try {
          targetArr =
            typeof exercise.target === 'string'
              ? JSON.parse(exercise.target)
              : exercise.target;
        } catch {
          targetArr = exercise.target;
        }

        let modifiersArr;
        try {
          modifiersArr =
            typeof exercise.modifiers === 'string'
              ? JSON.parse(exercise.modifiers)
              : exercise.modifiers;
        } catch {
          modifiersArr = exercise.modifiers;
        }

        // Render targets as a table if array, else as a string
        const renderTargets =
          Array.isArray(targetArr) && targetArr.length > 0
            ? `<table style="margin-bottom:6px;">
                <thead>
                  <tr>
                    ${Object.keys(targetArr[0])
                      .map(
                        (key) =>
                          `<th style="border-bottom:1px solid #eee;padding:2px 6px;font-size:13px;">${key}</th>`,
                      )
                      .join('')}
                  </tr>
                </thead>
                <tbody>
                  ${targetArr
                    .map(
                      (obj) =>
                        `<tr>${Object.values(obj)
                          .map(
                            (val) =>
                              `<td style="padding:2px 6px;font-size:13px;">${val}</td>`,
                          )
                          .join('')}</tr>`,
                    )
                    .join('')}
                </tbody>
              </table>`
            : `<span>${targetArr ? JSON.stringify(targetArr) : '-'}</span>`;

        // Render modifiers prettily
        const renderModifiers =
          Array.isArray(modifiersArr) && modifiersArr.length > 0
            ? `<ul>${modifiersArr.map((m) => `<li>${m}</li>`).join('')}</ul>`
            : `<em style="color:#888;">None</em>`;

        return `
          <div style="border:1px solid #ececec; border-radius:9px; padding:16px; margin-bottom:18px; background:#fcfcfc; width:fit-content; max-width:100%;">
            <div style="font-size:16px;font-weight:600;margin-bottom:5px;white-space:nowrap;">${formattedDate} &mdash; <span style="color:#2650a6;">${exercise.exercise_name}</span></div>
            <div>
              <b>Target Parameters:</b>
              ${renderTargets}
            </div>
            <div>
              <b>Modifiers:</b>
              ${renderModifiers}
            </div>
          </div>
        `;
      })
      .join('');

    return exerciseHtml;
  }
}
